import { jest } from '@jest/globals';
import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PasswordResetTokenService } from '../services/password-reset-token.service';
import { ForgotPasswordUseCase } from './forgot-password.use-case';
import { ResetPasswordUseCase } from './reset-password.use-case';
import { BcryptPasswordHasher } from '../../infrastructure/adapters/bcrypt-password-hasher';
import { NotificationService } from '../../../notifications/application/notification.service';
import { PasswordRecoveryNotification } from '../../../notifications/domain/password-recovery.notification';
import { EmailTemplateRenderer } from '../../../notifications/infrastructure/templates/email-template.renderer';

const id = '2ae91783-37a2-4a3b-935c-9dff571249d4';

describe('Password recovery', () => {
  let tokens: PasswordResetTokenService;
  let originalSecret: string | undefined;
  const hasher = new BcryptPasswordHasher();

  beforeEach(() => {
    originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'password-recovery-test-secret';
    tokens = new PasswordResetTokenService(new JwtService());
  });
  afterEach(() => {
    jest.restoreAllMocks();
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  function database(passwordHash = 'original-hash', status = 'active') {
    const state = {
      id,
      password_hash: passwordHash,
      status,
      email: 'user@example.test',
      full_name: 'Test User',
    };
    let flag = true;
    const db = {
      users: {
        findUnique: jest.fn(async () => ({ ...state })),
        updateMany: jest.fn(
          async ({
            where,
            data,
          }: {
            where: { password_hash: string };
            data: { password_hash: string };
          }) => {
            if (state.password_hash !== where.password_hash)
              return { count: 0 };
            state.password_hash = data.password_hash;
            return { count: 1 };
          },
        ),
      },
      user_must_change_password: {
        deleteMany: jest.fn(async () => {
          flag = false;
          return { count: 1 };
        }),
      },
      $transaction: async (work: (tx: unknown) => Promise<void>) => work(db),
    };
    return { db, state, hasFlag: () => flag };
  }

  it('sends a link without changing the current password', async () => {
    const { db, state } = database();
    const notifications = {
      assertAvailable: jest.fn(async () => {}),
      dispatch: jest.fn(
        async (
          _notification: PasswordRecoveryNotification,
          _options: unknown,
        ) => {},
      ),
    };
    await new ForgotPasswordUseCase(
      db as never,
      tokens,
      notifications as never,
    ).execute({ email: ' USER@EXAMPLE.TEST ' });
    expect(db.users.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.test' },
    });
    expect(state.password_hash).toBe('original-hash');
    expect(db.users.updateMany).not.toHaveBeenCalled();
    const [notification, options] = notifications.dispatch.mock.calls[0];
    const url = new URL(notification.payload.resetUrl);
    const token = new URLSearchParams(url.hash.slice(1)).get('token')!;
    expect((await tokens.verify(token)).sub).toBe(id);
    expect(url.pathname).toBe('/recuperar-password');
    expect(options).toEqual({ requireDelivery: true });
    const email = new EmailTemplateRenderer().render(notification);
    expect(email.text).toContain(notification.payload.resetUrl);
    expect(email.html).toContain('Crear nueva contraseña');
    expect(email.text).not.toContain('contraseña temporal');
  });

  it('keeps the same response for absent and inactive accounts', async () => {
    const { db } = database('original-hash', 'inactive');
    const notifications = {
      assertAvailable: async () => {},
      dispatch: jest.fn(),
    };
    const recovery = new ForgotPasswordUseCase(
      db as never,
      tokens,
      notifications as never,
    );
    const inactive = await recovery.execute({ email: 'inactive@example.test' });
    db.users.findUnique.mockResolvedValueOnce(null as never);
    expect(await recovery.execute({ email: 'unknown@example.test' })).toEqual(
      inactive,
    );
    expect(notifications.dispatch).not.toHaveBeenCalled();
  });

  it('reports SMTP failure without changing the password', async () => {
    const { db, state } = database();
    const notifications = {
      assertAvailable: async () => {},
      dispatch: async () => {
        throw new Error('SMTP unavailable');
      },
    };
    await expect(
      new ForgotPasswordUseCase(
        db as never,
        tokens,
        notifications as never,
      ).execute({ email: state.email }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(state.password_hash).toBe('original-hash');
  });

  it('reports missing SMTP configuration before account lookup', async () => {
    const { db } = database();
    const notifications = {
      assertAvailable: async () => {
        throw new Error('Not configured');
      },
    };
    await expect(
      new ForgotPasswordUseCase(
        db as never,
        tokens,
        notifications as never,
      ).execute({ email: 'user@example.test' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(db.users.findUnique).not.toHaveBeenCalled();
  });

  it('updates the password, clears the temporary flag and rejects reuse', async () => {
    const { db, state, hasFlag } = database(
      await hasher.hash('OldPassword123'),
    );
    const token = await tokens.issue(id, state.password_hash);
    const reset = new ResetPasswordUseCase(db as never, tokens, hasher);
    await expect(
      reset.execute({ token, newPassword: 'NewPassword456' }),
    ).resolves.toMatchObject({ success: true });
    expect(await hasher.compare('NewPassword456', state.password_hash)).toBe(
      true,
    );
    expect(await hasher.compare('OldPassword123', state.password_hash)).toBe(
      false,
    );
    expect(hasFlag()).toBe(false);
    await expect(
      reset.execute({ token, newPassword: 'OtherPassword789' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows exactly one concurrent reset with the same link', async () => {
    const { db, state } = database(await hasher.hash('OldPassword123'));
    const token = await tokens.issue(id, state.password_hash);
    const reset = new ResetPasswordUseCase(db as never, tokens, hasher);
    const results = await Promise.allSettled([
      reset.execute({ token, newPassword: 'NewPassword456' }),
      reset.execute({ token, newPassword: 'OtherPassword789' }),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
  });

  it('rejects expired and altered links', async () => {
    const token = await tokens.issue(id, 'original-hash');
    await expect(tokens.verify(token + 'x')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now + 31 * 60 * 1000);
    await expect(tokens.verify(token)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('does not accept reset tokens as access tokens or vice versa', async () => {
    const jwt = new JwtService({ secret: process.env.JWT_SECRET });
    const token = await tokens.issue(id, 'original-hash');
    await expect(jwt.verifyAsync(token)).rejects.toThrow();
    await expect(
      tokens.verify(await jwt.signAsync({ sub: id })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects inactive accounts, short passwords and the previous password', async () => {
    const { db, state } = database(await hasher.hash('OldPassword123'));
    const token = await tokens.issue(id, state.password_hash);
    const reset = new ResetPasswordUseCase(db as never, tokens, hasher);
    for (const password of ['short', 'OldPassword123', '😀'.repeat(20)]) {
      await expect(
        reset.execute({ token, newPassword: password }),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
    state.status = 'inactive';
    await expect(
      reset.execute({ token, newPassword: 'NewPassword456' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.users.updateMany).not.toHaveBeenCalled();
  });

  it('propagates delivery errors only when required', async () => {
    const provider = {
      channel: 'EMAIL',
      send: async () => {
        throw new Error('Delivery failed');
      },
    };
    const notifications = new NotificationService(provider as never);
    const notification = new PasswordRecoveryNotification(
      { id, email: 'user@example.test', name: 'Test User' },
      { resetUrl: 'https://example.test/recuperar-password#token=test' },
    );
    await expect(
      notifications.dispatch(notification, { requireDelivery: true }),
    ).rejects.toThrow('Delivery failed');
    await expect(notifications.dispatch(notification)).resolves.toBeUndefined();
  });
});
