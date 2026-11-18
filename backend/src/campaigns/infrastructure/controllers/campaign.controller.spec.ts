import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { CampaignController } from './campaign.controller';
import { CreateCampaignUseCase } from '../../application/use-cases/create-campaign.use-case';
import { UpdateCampaignUseCase } from '../../application/use-cases/update-campaign.use-case';
import { GetCampaignByIdUseCase } from '../../application/use-cases/get-campaign-by-id.use-case';
import { GetCampaignsUseCase } from '../../application/use-cases/get-campaigns.use-case';
import { GetMyCampaignsUseCase } from '../../application/use-cases/get-my-campaigns.use-case';
import { GetPendingReviewCampaignsUseCase } from '../../application/use-cases/get-pending-review-campaigns.use-case';
import { SubmitCampaignForReviewUseCase } from '../../application/use-cases/submit-campaign-for-review.use-case';
import { ReviewCampaignUseCase } from '../../application/use-cases/review-campaign.use-case';
import { PublishCampaignUseCase } from '../../application/use-cases/publish-campaign.use-case';
import { UploadCampaignCoverUseCase } from '../../application/use-cases/upload-campaign-cover.use-case';
import { GetCampaignReviewsUseCase } from '../../application/use-cases/get-campaign-reviews.use-case';
import { GetCampaignPlanUseCase } from '../../application/use-cases/get-campaign-plan.use-case';
import { SaveCampaignPlanUseCase } from '../../application/use-cases/save-campaign-plan.use-case';
import { CreateCampaignHttpDto } from './dto/create-campaign.http-dto';
import { UpdateCampaignHttpDto } from './dto/update-campaign.http-dto';

describe('CampaignController', () => {
  let controller: CampaignController;
  let createCampaignUseCase: { execute: jest.Mock };
  let updateCampaignUseCase: { execute: jest.Mock };
  let getCampaignsUseCase: { execute: jest.Mock };
  let getMyCampaignsUseCase: { execute: jest.Mock };
  let getCampaignByIdUseCase: { execute: jest.Mock };
  let getPendingReviewCampaignsUseCase: { execute: jest.Mock };
  let submitCampaignForReviewUseCase: { execute: jest.Mock };
  let reviewCampaignUseCase: { execute: jest.Mock };
  let publishCampaignUseCase: { execute: jest.Mock };
  let uploadCampaignCoverUseCase: { execute: jest.Mock };
  let getCampaignReviewsUseCase: { execute: jest.Mock };
  let getCampaignPlanUseCase: { execute: jest.Mock };
  let saveCampaignPlanUseCase: { execute: jest.Mock };

  const httpDto = {
    title: 'Bosque nativo del valle',
    category: 'ambiental',
    campaignType: 'donation',
    fundingModel: 'flexible',
    goalAmount: 15000,
    location: 'Cochabamba',
    shortSummary: 'Protección de la biodiversidad andina con la comunidad local.',
  } as CreateCampaignHttpDto;

  beforeEach(() => {
    createCampaignUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 'campaign-1' }),
    };
    updateCampaignUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 'campaign-1' }),
    };
    getCampaignsUseCase = {
      execute: jest.fn().mockResolvedValue([]),
    };
    getMyCampaignsUseCase = {
      execute: jest.fn().mockResolvedValue([{ id: 'mine-1' }]),
    };
    getCampaignByIdUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 'campaign-1' }),
    };
    getPendingReviewCampaignsUseCase = {
      execute: jest.fn().mockResolvedValue([]),
    };
    submitCampaignForReviewUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 'campaign-1', status: 'pending_review' }),
    };
    reviewCampaignUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 'campaign-1', status: 'approved' }),
    };
    publishCampaignUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 'campaign-1', status: 'published' }),
    };
    uploadCampaignCoverUseCase = {
      execute: jest.fn().mockResolvedValue({ publicPath: '/uploads/campaign-covers/x.jpg' }),
    };
    getCampaignReviewsUseCase = {
      execute: jest.fn().mockResolvedValue([]),
    };
    const createCampaignUpdateUseCase = {
      execute: jest.fn().mockResolvedValue({ id: 'update-1' }),
    };
    const getCampaignUpdatesUseCase = {
      execute: jest.fn().mockResolvedValue([]),
    };
    const deleteCampaignUpdateUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    };
    const getSocialFeedUseCase = {
      execute: jest.fn().mockResolvedValue([]),
    };
    const getCampaignStoriesUseCase = {
      execute: jest.fn().mockResolvedValue([]),
    };
    const getSuggestedCampaignsUseCase = {
      execute: jest.fn().mockResolvedValue([]),
    };
    getCampaignPlanUseCase = {
      execute: jest.fn().mockResolvedValue({ campaignId: 'campaign-1' }),
    };
    saveCampaignPlanUseCase = {
      execute: jest.fn().mockResolvedValue({ campaignId: 'campaign-1' }),
    };
    const upsertCampaignBookmarkUseCase = { execute: jest.fn() };
    const removeCampaignBookmarkUseCase = { execute: jest.fn() };
    const listMyBookmarksUseCase = { execute: jest.fn().mockResolvedValue([]) };
    const listMyBookmarkIdsUseCase = { execute: jest.fn().mockResolvedValue([]) };

    controller = new CampaignController(
      createCampaignUseCase as unknown as CreateCampaignUseCase,
      updateCampaignUseCase as unknown as UpdateCampaignUseCase,
      getCampaignByIdUseCase as unknown as GetCampaignByIdUseCase,
      getCampaignsUseCase as unknown as GetCampaignsUseCase,
      getMyCampaignsUseCase as unknown as GetMyCampaignsUseCase,
      getPendingReviewCampaignsUseCase as unknown as GetPendingReviewCampaignsUseCase,
      submitCampaignForReviewUseCase as unknown as SubmitCampaignForReviewUseCase,
      reviewCampaignUseCase as unknown as ReviewCampaignUseCase,
      publishCampaignUseCase as unknown as PublishCampaignUseCase,
      uploadCampaignCoverUseCase as unknown as UploadCampaignCoverUseCase,
      getCampaignReviewsUseCase as unknown as GetCampaignReviewsUseCase,
      createCampaignUpdateUseCase as unknown as any,
      getCampaignUpdatesUseCase as unknown as any,
      deleteCampaignUpdateUseCase as unknown as any,
      getSocialFeedUseCase as unknown as any,
      getCampaignStoriesUseCase as unknown as any,
      getSuggestedCampaignsUseCase as unknown as any,
      getCampaignPlanUseCase as unknown as GetCampaignPlanUseCase,
      saveCampaignPlanUseCase as unknown as SaveCampaignPlanUseCase,
      upsertCampaignBookmarkUseCase as unknown as any,
      removeCampaignBookmarkUseCase as unknown as any,
      listMyBookmarksUseCase as unknown as any,
      listMyBookmarkIdsUseCase as unknown as any,
    );
  });

  it('assigns ownerUserId from CurrentUser id, not from the HTTP body', async () => {
    const authenticatedUserId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    await controller.create(httpDto, authenticatedUserId);

    expect(createCampaignUseCase.execute).toHaveBeenCalledTimes(1);
    expect(createCampaignUseCase.execute).toHaveBeenCalledWith({
      ...httpDto,
      ownerUserId: authenticatedUserId,
    });
  });

  it('ignores a forged ownerUserId if it appears on the HTTP payload', async () => {
    const authenticatedUserId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const forgedBody = {
      ...httpDto,
      ownerUserId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    } as CreateCampaignHttpDto & { ownerUserId: string };

    await controller.create(forgedBody, authenticatedUserId);

    const command = createCampaignUseCase.execute.mock.calls[0][0] as {
      ownerUserId: string;
    };
    expect(command.ownerUserId).toBe(authenticatedUserId);
  });

  it('does not declare ownerUserId on the HTTP DTO', () => {
    const instance = new CreateCampaignHttpDto();
    expect('ownerUserId' in instance).toBe(false);
  });

  it('builds the update command from the route param and CurrentUser id', async () => {
    const authenticatedUserId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const changes = {
      title: 'Bosque nativo actualizado',
      problem: 'Pérdida de cobertura vegetal.',
    } as UpdateCampaignHttpDto;

    await controller.update('campaign-1', changes, authenticatedUserId);

    expect(updateCampaignUseCase.execute).toHaveBeenCalledTimes(1);
    expect(updateCampaignUseCase.execute).toHaveBeenCalledWith({
      campaignId: 'campaign-1',
      authenticatedUserId,
      changes,
    });
  });

  it('forces public list to published and ignores private query filters', async () => {
    await controller.findAll({
      category: 'ambiental',
      status: 'draft',
      ownerUserId: 'someone',
    } as never);

    expect(getCampaignsUseCase.execute).toHaveBeenCalledWith({
      category: 'ambiental',
      status: 'published',
    });
  });

  it('lists mine using CurrentUser id', async () => {
    const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    await controller.findMine(userId);
    expect(getMyCampaignsUseCase.execute).toHaveBeenCalledWith(userId);
  });

  it('rejects owner lookup for a different user id', async () => {
    await expect(
      controller.findByOwner('other-user', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('passes viewer context into getById', async () => {
    await controller.findById('campaign-1', { id: 'u1', role: 'creator' });
    expect(getCampaignByIdUseCase.execute).toHaveBeenCalledWith('campaign-1', {
      id: 'u1',
      role: 'creator',
    });
  });

  it('submits review with authenticated user id', async () => {
    await controller.submitReview('campaign-1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    expect(submitCampaignForReviewUseCase.execute).toHaveBeenCalledWith(
      'campaign-1',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
  });

  it('delegates admin review actions', async () => {
    const adminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    await controller.approve('campaign-1', adminId, {});
    await controller.reject('campaign-1', adminId, {
      rejectionReason: 'Falta documentación legal del proyecto.',
    });
    await controller.requestChanges('campaign-1', adminId, {
      sectionNotes: { funding: 'Ajusta la meta de financiamiento.' },
    });
    await controller.publish('campaign-1');

    expect(reviewCampaignUseCase.execute).toHaveBeenCalledWith({
      campaignId: 'campaign-1',
      reviewerUserId: adminId,
      action: 'approve',
      notes: undefined,
      sectionNotes: undefined,
    });
    expect(reviewCampaignUseCase.execute).toHaveBeenCalledWith({
      campaignId: 'campaign-1',
      reviewerUserId: adminId,
      action: 'reject',
      rejectionReason: 'Falta documentación legal del proyecto.',
      notes: undefined,
      sectionNotes: undefined,
    });
    expect(reviewCampaignUseCase.execute).toHaveBeenCalledWith({
      campaignId: 'campaign-1',
      reviewerUserId: adminId,
      action: 'request_changes',
      notes: undefined,
      sectionNotes: { funding: 'Ajusta la meta de financiamiento.' },
    });
    expect(publishCampaignUseCase.execute).toHaveBeenCalledWith('campaign-1');
  });

  it('passes viewer context into getPlan', async () => {
    await controller.getPlan('campaign-1', null);
    expect(getCampaignPlanUseCase.execute).toHaveBeenCalledWith('campaign-1', null);
  });

  it('saves the plan with the authenticated user id, not one from the body', async () => {
    const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const activities = [
      { name: 'Preparar terreno', startDate: '2026-11-01', endDate: '2026-11-15' },
    ];
    const budgetItems = [{ category: 'Materiales', description: 'Plantines', amount: 1200 }];

    await controller.savePlan('campaign-1', { activities, budgetItems }, userId);

    expect(saveCampaignPlanUseCase.execute).toHaveBeenCalledWith({
      campaignId: 'campaign-1',
      authenticatedUserId: userId,
      activities,
      budgetItems,
    });
  });
});
