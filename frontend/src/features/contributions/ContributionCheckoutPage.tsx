import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Gift,
  Heart,
  Loader2,
  Lock,
  QrCode,
  ShoppingBag,
  XCircle,
} from 'lucide-react';
import {
  campaignsApi,
  type CampaignResponse,
  type CampaignRewardResponse,
} from '../../shared/api/campaignsApi.ts';
import {
  contributionsApi,
  type Contribution,
  type ContributionType,
  type PaymentMethod,
} from '../../shared/api/contributionsApi.ts';
import { getApiErrorMessage } from '../auth/utils/getApiErrorMessage.ts';
import { CampaignRewardList } from '../campaigns/components/CampaignRewardList.tsx';
import { isRewardSelectable, useCampaignRewards } from '../campaigns/hooks/useCampaignRewards.ts';
import { formatIsoDate } from '../creator/campaign-creation/planningValidation.ts';
import {
  formatMoney,
  isTwoDecimalAmount,
  MIN_DONATION_AMOUNT,
  paymentMethodLabels,
  SUGGESTED_AMOUNTS,
} from './contributionLabels.ts';
import './ContributionsModule.css';

export interface ContributionCheckoutPageProps {
  campaignId: string | null;
  /** Aporte previo de esta campaña: si sigue pendiente se paga ese mismo; si no, se reusan sus datos. */
  resumeContributionId?: string | null;
  onBack: () => void;
  onFinished?: () => void;
}

type Step = 'amount' | 'payment' | 'result';

const TYPE_OPTIONS: { id: ContributionType; label: string; hint: string; icon: typeof Heart }[] = [
  { id: 'donation', label: 'Donación', hint: 'Apoyas el proyecto sin recibir nada a cambio', icon: Heart },
  { id: 'reward', label: 'Recompensa', hint: 'Eliges una recompensa del creador', icon: Gift },
  { id: 'presale', label: 'Preventa', hint: 'Reservas el producto antes de su lanzamiento', icon: ShoppingBag },
];

const METHOD_OPTIONS: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { id: 'card', label: 'Tarjeta', icon: CreditCard },
  { id: 'qr', label: 'QR simple', icon: QrCode },
  { id: 'transfer', label: 'Transferencia', icon: Banknote },
];

/** Checkout de aporte: elegir, pagar (simulado) y ver el comprobante. */
export const ContributionCheckoutPage: FC<ContributionCheckoutPageProps> = ({
  campaignId,
  resumeContributionId = null,
  onBack,
  onFinished,
}) => {
  const [campaign, setCampaign] = useState<CampaignResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState<string>('');
  const [contributionType, setContributionType] = useState<ContributionType>('donation');
  const [rewardId, setRewardId] = useState<string | null>(null);
  const [supporterMessage, setSupporterMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [method, setMethod] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [contribution, setContribution] = useState<Contribution | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [declineReason, setDeclineReason] = useState<string | null>(null);
  /** El pago se rechazo porque la recompensa se quedo sin cupos. */
  const [rewardSoldOut, setRewardSoldOut] = useState(false);

  useEffect(() => {
    if (!campaignId) {
      setIsLoading(false);
      setError('No se indicó la campaña a apoyar.');
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        let previousError: unknown = null;
        const [data, previous] = await Promise.all([
          campaignsApi.getById(campaignId),
          resumeContributionId
            ? contributionsApi.getById(resumeContributionId).catch((err: unknown) => {
                previousError = err;
                return null;
              })
            : Promise.resolve(null),
        ]);
        if (cancelled) return;

        setResumeError(
          previousError
            ? getApiErrorMessage(previousError, 'No se pudo recuperar tu aporte anterior.')
            : null,
        );
        setCampaign(data);
        // El tipo por defecto es el que acepta la campaña.
        const campaignType = TYPE_OPTIONS.some((option) => option.id === data.campaignType)
          ? (data.campaignType as ContributionType)
          : 'donation';
        setContributionType(campaignType);
        if (previous && previous.campaignId === data.id) {
          setContributionType(previous.contributionType);
          setRewardId(previous.rewardId);
          setAmount(String(previous.amount));
          if (previous.status === 'pending') {
            setContribution(previous);
            setStep('payment');
          }
        }
        setError(null);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'No se pudo cargar la campaña.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [campaignId, resumeContributionId]);

  const currency = campaign?.currency || 'BOB';
  const isRewardCampaign = campaign?.campaignType === 'reward';
  const rewardsState = useCampaignRewards(campaign?.id, isRewardCampaign);
  const needsReward = contributionType === 'reward';
  const selectedReward: CampaignRewardResponse | null = needsReward
    ? (rewardsState.rewards.find((reward) => reward.id === rewardId) ?? null)
    : null;
  const minAmount = needsReward
    ? (selectedReward?.minimumContribution ?? null)
    : MIN_DONATION_AMOUNT;

  const numericAmount = Number(amount);
  const hasAmountFormat = isTwoDecimalAmount(amount) && numericAmount > 0;
  const isAmountValid = hasAmountFormat && minAmount !== null && numericAmount >= minAmount;
  const canContinue =
    isAmountValid && (!needsReward || (selectedReward !== null && isRewardSelectable(selectedReward)));

  let amountHint: string | null = null;
  if (amount.trim() && !hasAmountFormat) {
    amountHint = 'Ingresa un monto válido, con hasta dos decimales.';
  } else if (amount.trim() && minAmount !== null && numericAmount < minAmount) {
    amountHint = `El aporte mínimo ${needsReward ? 'para esta recompensa ' : ''}es ${formatMoney(minAmount, currency)}.`;
  }

  const selectableRewards = rewardsState.rewards.filter(isRewardSelectable);
  const noRewardsAvailable =
    needsReward && !rewardsState.isLoading && !rewardsState.error && selectableRewards.length === 0;

  // Si la campaña tiene una sola recompensa disponible, se elige sola: así el
  // botón de continuar no queda bloqueado sin que se entienda por qué (QA #16).
  if (needsReward && !rewardId && !rewardsState.isLoading && selectableRewards.length === 1) {
    const onlyReward = selectableRewards[0];
    setRewardId(onlyReward.id);
    if (!(Number(amount) >= onlyReward.minimumContribution)) {
      setAmount(String(onlyReward.minimumContribution));
    }
  }

  /** Mismas reglas que el backend: solo campañas publicadas y dentro de su periodo. */
  let campaignClosedReason: string | null = null;
  if (campaign && campaign.status !== 'published') {
    campaignClosedReason = 'Esta campaña no está recibiendo aportes en este momento.';
  } else if (campaign?.endDate && new Date(campaign.endDate) < new Date()) {
    campaignClosedReason = `Esta campaña cerró su recaudación el ${formatIsoDate(campaign.endDate.slice(0, 10))}.`;
  }

  /** Por qué no se puede continuar todavía; se muestra junto al botón. */
  let continueBlockedReason: string | null = null;
  // Con la campaña cerrada el aviso ya se muestra arriba del formulario.
  if (!campaignClosedReason && !canContinue) {
    if (needsReward && rewardsState.isLoading) {
      continueBlockedReason = 'Cargando las recompensas de la campaña…';
    } else if (noRewardsAvailable) {
      continueBlockedReason =
        'Esta campaña no tiene recompensas disponibles en este momento. Puedes apoyarla con una donación.';
    } else if (needsReward && !selectedReward) {
      continueBlockedReason = 'Elige una recompensa para continuar.';
    } else if (needsReward && selectedReward && !isRewardSelectable(selectedReward)) {
      continueBlockedReason = 'La recompensa elegida ya no está disponible. Elige otra.';
    } else if (!amount.trim()) {
      continueBlockedReason = 'Ingresa el monto de tu aporte para continuar.';
    } else if (!amountHint) {
      continueBlockedReason = 'Revisa el monto de tu aporte.';
    }
  }

  /** Donación siempre; además, el tipo propio de la campaña. */
  const availableTypes = useMemo(() => {
    if (!campaign) return TYPE_OPTIONS.filter((option) => option.id === 'donation');
    return TYPE_OPTIONS.filter((option) => option.id === 'donation' || option.id === campaign.campaignType);
  }, [campaign]);

  const selectReward = (reward: CampaignRewardResponse) => {
    setRewardId(reward.id);
    if (!(Number(amount) >= reward.minimumContribution)) {
      setAmount(String(reward.minimumContribution));
    }
  };

  const commission = useMemo(
    () => (isAmountValid ? Math.round(numericAmount * 5) / 100 : 0),
    [isAmountValid, numericAmount],
  );

  const goToPayment = async () => {
    if (!campaign || !canContinue) return;
    setIsSubmitting(true);
    try {
      const created = await contributionsApi.create({
        campaignId: campaign.id,
        amount: numericAmount,
        contributionType,
        rewardId: needsReward && selectedReward ? selectedReward.id : undefined,
        supporterMessage: supporterMessage.trim() || undefined,
        isAnonymous,
      });
      setContribution(created);
      setStep('payment');
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo registrar el aporte.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPayment = async () => {
    if (!contribution) return;
    setIsSubmitting(true);
    setDeclineReason(null);
    try {
      const result = await contributionsApi.pay(
        contribution.id,
        method,
        method === 'card'
          ? { number: cardNumber, holder: cardHolder, expiry: cardExpiry, cvv: cardCvv }
          : undefined,
      );
      setContribution(result.contribution);
      setDeclineReason(result.approved ? null : (result.declineReason ?? 'El pago fue rechazado'));
      const soldOut =
        !result.approved &&
        Boolean(result.contribution.rewardId) &&
        /recompensa/i.test(result.declineReason ?? result.contribution.failureReason ?? '');
      setRewardSoldOut(soldOut);
      // Los cupos cambiaron: la lista de recompensas tiene que reflejarlo al volver.
      if (soldOut) rewardsState.reload();
      setStep('result');
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo procesar el pago.'));
      if (contribution.rewardId) rewardsState.reload();
    } finally {
      setIsSubmitting(false);
    }
  };

  const retry = async () => {
    if (!campaign) return;
    if (rewardSoldOut) {
      // La recompensa agotada ya no se puede elegir: el patrocinador elige otra.
      setRewardId(null);
      rewardsState.reload();
    }
    setContribution(null);
    setDeclineReason(null);
    setRewardSoldOut(false);
    setStep('amount');
  };

  /** Tras agotarse la recompensa, ofrece seguir apoyando con una donación. */
  const switchToDonation = () => {
    setContributionType('donation');
    setRewardId(null);
    setContribution(null);
    setDeclineReason(null);
    setRewardSoldOut(false);
    setStep('amount');
  };

  const cancelCheckout = async () => {
    if (contribution && contribution.status === 'pending') {
      try {
        await contributionsApi.cancel(contribution.id);
      } catch {
        // Si no se pudo cancelar, el aporte queda pendiente y el patrocinador
        // lo verá en "Mis aportes"; no tiene sentido bloquear la salida.
      }
    }
    onBack();
  };

  if (isLoading) {
    return <p className="brotar-checkout__state">Cargando campaña…</p>;
  }

  if (error && !campaign) {
    return (
      <div className="brotar-checkout">
        <button type="button" className="brotar-checkout__back" onClick={onBack}>
          <ArrowLeft size={16} /> Volver
        </button>
        <p className="brotar-checkout__error">{error}</p>
      </div>
    );
  }

  return (
    <div className="brotar-checkout">
      <button type="button" className="brotar-checkout__back" onClick={cancelCheckout}>
        <ArrowLeft size={16} /> Volver al proyecto
      </button>

      <header className="brotar-checkout__header">
        <h1 className="brotar-checkout__title">Apoyar este proyecto</h1>
        <p className="brotar-checkout__subtitle">{campaign?.title}</p>
      </header>

      <ol className="brotar-checkout__steps">
        {[
          { id: 'amount', label: 'Tu aporte' },
          { id: 'payment', label: 'Pago' },
          { id: 'result', label: 'Comprobante' },
        ].map((item, index) => (
          <li
            key={item.id}
            className={`brotar-checkout__step ${step === item.id ? 'is-active' : ''} ${
              ['amount', 'payment', 'result'].indexOf(step) > index ? 'is-done' : ''
            }`}
          >
            <span>{index + 1}</span>
            {item.label}
          </li>
        ))}
      </ol>

      {error ? <p className="brotar-checkout__error">{error}</p> : null}
      {resumeError ? (
        <p className="brotar-checkout__notice" role="alert">
          {resumeError} Puedes empezar un aporte nuevo; revisa en tus aportes si el anterior quedó
          pendiente.
        </p>
      ) : null}

      {step === 'amount' && campaignClosedReason ? (
        <p className="brotar-checkout__notice" role="alert">
          {campaignClosedReason} Puedes ver otros proyectos que siguen recaudando.
        </p>
      ) : null}

      {step === 'amount' ? (
        <section className="brotar-checkout__panel">
          <h2 className="brotar-checkout__panel-title">¿Cómo quieres apoyar?</h2>
          <div className="brotar-checkout__types">
            {availableTypes.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  type="button"
                  key={option.id}
                  className={`brotar-checkout__type ${contributionType === option.id ? 'is-active' : ''}`}
                  onClick={() => setContributionType(option.id)}
                >
                  <Icon size={18} />
                  <strong>{option.label}</strong>
                  <span>{option.hint}</span>
                </button>
              );
            })}
          </div>

          {needsReward ? (
            <>
              <h2 className="brotar-checkout__panel-title">Elige tu recompensa</h2>
              <CampaignRewardList
                rewards={rewardsState.rewards}
                isLoading={rewardsState.isLoading}
                error={rewardsState.error}
                onRetry={rewardsState.reload}
                emptyMessage="Esta campaña todavía no tiene recompensas disponibles. Puedes apoyarla con una donación."
                selectedRewardId={rewardId}
                onSelect={selectReward}
              />
              {rewardId && !selectedReward && !rewardsState.isLoading ? (
                <p className="brotar-checkout__notice">
                  La recompensa que habías elegido ya no está disponible. Elige otra.
                </p>
              ) : null}
            </>
          ) : null}

          {contributionType === 'presale' ? (
            <p className="brotar-checkout__notice">
              La preventa todavía no tiene productos ni condiciones definidas en Brotar: tu aporte
              se registra como preventa, sin un producto asociado.
            </p>
          ) : null}

          <h2 className="brotar-checkout__panel-title">Monto del aporte</h2>
          <div className="brotar-checkout__amounts">
            {SUGGESTED_AMOUNTS.map((value) => (
              <button
                type="button"
                key={value}
                className={`brotar-checkout__amount ${Number(amount) === value ? 'is-active' : ''}`}
                disabled={minAmount !== null && value < minAmount}
                onClick={() => setAmount(String(value))}
              >
                {formatMoney(value, currency)}
              </button>
            ))}
          </div>

          <label className="brotar-checkout__field">
            <span>Otro monto ({currency})</span>
            <input
              type="number"
              min={minAmount ?? undefined}
              step="0.01"
              inputMode="decimal"
              value={amount}
              placeholder={
                minAmount !== null
                  ? `Mínimo ${formatMoney(minAmount, currency)}`
                  : 'Elige una recompensa primero'
              }
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          {amountHint ? <p className="brotar-checkout__notice">{amountHint}</p> : null}

          <label className="brotar-checkout__field">
            <span>Mensaje para el creador (opcional)</span>
            <textarea
              maxLength={500}
              value={supporterMessage}
              placeholder="Cuéntale por qué apoyas este proyecto…"
              onChange={(event) => setSupporterMessage(event.target.value)}
            />
          </label>

          <label className="brotar-checkout__checkbox">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(event) => setIsAnonymous(event.target.checked)}
            />
            Quiero que mi aporte figure como anónimo
          </label>

          {isAmountValid ? (
            <div className="brotar-checkout__summary">
              {selectedReward ? (
                <div>
                  <span>Recompensa</span>
                  <strong>{selectedReward.title}</strong>
                </div>
              ) : null}
              <div>
                <span>Tu aporte</span>
                <strong>{formatMoney(numericAmount, currency)}</strong>
              </div>
              <div>
                <span>Comisión Brotar (5%)</span>
                <strong>{formatMoney(commission, currency)}</strong>
              </div>
              <div className="is-total">
                <span>Llega al proyecto</span>
                <strong>{formatMoney(numericAmount - commission, currency)}</strong>
              </div>
            </div>
          ) : null}

          {continueBlockedReason ? (
            <p className="brotar-checkout__notice" role="status">
              {continueBlockedReason}
              {noRewardsAvailable ? (
                <>
                  {' '}
                  <button
                    type="button"
                    className="brotar-checkout__link"
                    onClick={() => setContributionType('donation')}
                  >
                    Apoyar con una donación
                  </button>
                </>
              ) : null}
            </p>
          ) : null}

          <button
            type="button"
            className="brotar-checkout__cta"
            disabled={!canContinue || isSubmitting || Boolean(campaignClosedReason)}
            onClick={() => void goToPayment()}
          >
            {isSubmitting ? <Loader2 size={16} className="brotar-checkout__spin" /> : null}
            Continuar al pago
          </button>
        </section>
      ) : null}

      {step === 'payment' && contribution ? (
        <section className="brotar-checkout__panel">
          <h2 className="brotar-checkout__panel-title">Método de pago</h2>
          <div className="brotar-checkout__methods">
            {METHOD_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  type="button"
                  key={option.id}
                  className={`brotar-checkout__method ${method === option.id ? 'is-active' : ''}`}
                  onClick={() => setMethod(option.id)}
                >
                  <Icon size={18} />
                  {option.label}
                </button>
              );
            })}
          </div>

          {method === 'card' ? (
            <div className="brotar-checkout__card-form">
              <label className="brotar-checkout__field">
                <span>Número de tarjeta</span>
                <input
                  inputMode="numeric"
                  maxLength={19}
                  value={cardNumber}
                  placeholder="4111 1111 1111 1111"
                  onChange={(event) => setCardNumber(event.target.value)}
                />
              </label>
              <label className="brotar-checkout__field">
                <span>Titular</span>
                <input
                  value={cardHolder}
                  placeholder="Como figura en la tarjeta"
                  onChange={(event) => setCardHolder(event.target.value)}
                />
              </label>
              <div className="brotar-checkout__field-row">
                <label className="brotar-checkout__field">
                  <span>Vencimiento</span>
                  <input
                    maxLength={5}
                    value={cardExpiry}
                    placeholder="MM/AA"
                    onChange={(event) => setCardExpiry(event.target.value)}
                  />
                </label>
                <label className="brotar-checkout__field">
                  <span>CVV</span>
                  <input
                    inputMode="numeric"
                    maxLength={4}
                    value={cardCvv}
                    placeholder="123"
                    onChange={(event) => setCardCvv(event.target.value)}
                  />
                </label>
              </div>
              <p className="brotar-checkout__hint">
                <Lock size={13} /> Pago simulado: no se cobra nada ni se guarda el número de la
                tarjeta. Para probar un rechazo, usa una tarjeta terminada en 0000.
              </p>
            </div>
          ) : (
            <p className="brotar-checkout__notice">
              {method === 'qr'
                ? 'Se generará un QR simulado y el aporte se dará por acreditado al confirmar.'
                : 'La transferencia se dará por acreditada al confirmar. Es un pago simulado.'}
            </p>
          )}

          <div className="brotar-checkout__summary">
            {contribution.rewardTitle ? (
              <div>
                <span>Recompensa</span>
                <strong>{contribution.rewardTitle}</strong>
              </div>
            ) : null}
            <div>
              <span>Aporte a {contribution.campaignTitle}</span>
              <strong>{formatMoney(contribution.amount, contribution.currency)}</strong>
            </div>
            <div className="is-total">
              <span>Total a pagar</span>
              <strong>{formatMoney(contribution.amount, contribution.currency)}</strong>
            </div>
          </div>

          <button
            type="button"
            className="brotar-checkout__cta"
            disabled={isSubmitting}
            onClick={() => void submitPayment()}
          >
            {isSubmitting ? <Loader2 size={16} className="brotar-checkout__spin" /> : null}
            {isSubmitting ? 'Procesando pago…' : 'Pagar ahora'}
          </button>
        </section>
      ) : null}

      {step === 'result' && contribution ? (
        <section className="brotar-checkout__panel brotar-checkout__panel--result">
          {contribution.status === 'confirmed' ? (
            <>
              <CheckCircle2 size={44} className="brotar-checkout__result-icon is-ok" />
              <h2 className="brotar-checkout__result-title">¡Gracias por tu aporte!</h2>
              <p className="brotar-checkout__result-text">
                Aportaste {formatMoney(contribution.amount, contribution.currency)} a{' '}
                {contribution.campaignTitle}.
              </p>
              <dl className="brotar-checkout__receipt">
                <div>
                  <dt>Comprobante</dt>
                  <dd>{contribution.gatewayReference}</dd>
                </div>
                <div>
                  <dt>Método</dt>
                  <dd>
                    {contribution.paymentMethod
                      ? (paymentMethodLabels[contribution.paymentMethod] ?? contribution.paymentMethod)
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt>Llega al proyecto</dt>
                  <dd>{formatMoney(contribution.netAmount, contribution.currency)}</dd>
                </div>
                {contribution.rewardTitle ? (
                  <div>
                    <dt>Recompensa</dt>
                    <dd>
                      {contribution.rewardTitle}
                      {contribution.rewardEstimatedDeliveryOn
                        ? ` · entrega estimada ${formatIsoDate(contribution.rewardEstimatedDeliveryOn)}`
                        : ''}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <div className="brotar-checkout__result-actions">
                <button type="button" className="brotar-checkout__cta" onClick={() => onFinished?.()}>
                  Ver mis aportes
                </button>
                <button type="button" className="brotar-checkout__ghost" onClick={onBack}>
                  Volver al proyecto
                </button>
              </div>
            </>
          ) : (
            <>
              <XCircle size={44} className="brotar-checkout__result-icon is-error" />
              <h2 className="brotar-checkout__result-title">No pudimos cobrar tu aporte</h2>
              <p className="brotar-checkout__result-text">
                {declineReason ?? contribution.failureReason ?? 'El pago fue rechazado.'}
              </p>
              <div className="brotar-checkout__result-actions">
                <button type="button" className="brotar-checkout__cta" onClick={() => void retry()}>
                  {rewardSoldOut ? 'Elegir otra recompensa' : 'Intentar de nuevo'}
                </button>
                {rewardSoldOut ? (
                  <button type="button" className="brotar-checkout__ghost" onClick={switchToDonation}>
                    Apoyar con una donación
                  </button>
                ) : null}
                <button type="button" className="brotar-checkout__ghost" onClick={onBack}>
                  Volver al proyecto
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
};
