import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../../../shared/index.ts';
import { campaignsApi } from '../../../shared/api/index.ts';
import { useAuth } from '../../auth/context/useAuth.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';
import { StepCampaignType } from './steps/StepCampaignType.tsx';
import { StepGeneralInfo } from './steps/StepGeneralInfo.tsx';
import { StepStoryImpact } from './steps/StepStoryImpact.tsx';
import { StepPlanBudget } from './steps/StepPlanBudget.tsx';
import { StepFunding } from './steps/StepFunding.tsx';
import { StepRewards } from './steps/StepRewards.tsx';
import { StepKycStatus } from './steps/StepKycStatus.tsx';
import { StepFinalReview } from './steps/StepFinalReview.tsx';
import { INITIAL_CAMPAIGN_DRAFT, INITIAL_PLANNING_DRAFT } from './state.ts';
import {
  buildCreateCampaignRequest,
  buildUpdateCampaignRequest,
} from './buildCreateCampaignRequest.ts';
import { mapCampaignCreateError, mapRewardPersistenceError } from './mapCampaignCreateError.ts';
import { mapCampaignResponseToDraft } from './mapCampaignResponseToDraft.ts';
import { buildSavePlanRequest, mapPlanResponseToPlanning } from './planMapping.ts';
import {
  fromRewardResponse,
  isRewardSyncPlanEmpty,
  planRewardSync,
  snapshotOf,
  toRewardPayload,
  type RewardSnapshot,
} from './rewardsSync.ts';
import type {
  CampaignCreationDraft,
  CampaignPlanningDraft,
  CampaignTypeValue,
  WizardStep,
} from './types.ts';
import './CampaignCreationWizardPage.css';

class RewardSyncError extends Error {}

export interface CampaignCreationWizardPageProps {
  campaignId?: string | null;
  /** When returning from KYC verification, reopen on this step (default load rules otherwise). */
  resumeStep?: WizardStep | null;
  onResumeStepConsumed?: () => void;
  onExit: () => void;
  onNavigate?: (itemId: string) => void;
  /** Opens the real creator verification route; campaignId preserves saved wizard progress. */
  onGoToVerification?: (campaignId: string) => void;
  onLogout?: () => void;
  onSearchProjects?: (query: string) => void;
}

export function CampaignCreationWizardPage({
  campaignId = null,
  resumeStep = null,
  onResumeStepConsumed,
  onExit,
  onNavigate,
  onGoToVerification,
  onLogout,
  onSearchProjects,
}: CampaignCreationWizardPageProps) {
  const { user, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [draft, setDraft] = useState<CampaignCreationDraft>(INITIAL_CAMPAIGN_DRAFT);
  const [planning, setPlanning] = useState<CampaignPlanningDraft>(INITIAL_PLANNING_DRAFT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isPlanDirty, setIsPlanDirty] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(campaignId);
  const [campaignStatus, setCampaignStatus] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverCleared, setCoverCleared] = useState(false);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(Boolean(campaignId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<
    'created' | 'updated' | 'submitted' | null
  >(null);
  const submitLockRef = useRef(false);
  const [rewardSnapshot, setRewardSnapshot] = useState<RewardSnapshot>({});
  const rewardSnapshotRef = useRef<RewardSnapshot>({});
  const [isLoadingRewards, setIsLoadingRewards] = useState(Boolean(campaignId));
  const [rewardsLoadError, setRewardsLoadError] = useState<string | null>(null);
  const [planLoadError, setPlanLoadError] = useState<string | null>(null);
  const [isRetryingPlan, setIsRetryingPlan] = useState(false);
  const [isOpeningVerification, setIsOpeningVerification] = useState(false);
  const [togglingRewardId, setTogglingRewardId] = useState<string | null>(null);
  const [verificationNavError, setVerificationNavError] = useState<string | null>(null);
  const planRequestRef = useRef(0);
  const resumeStepRef = useRef<WizardStep | null>(resumeStep);

  useEffect(() => {
    resumeStepRef.current = resumeStep;
  }, [resumeStep]);

  const commitRewardSnapshot = useCallback((next: RewardSnapshot) => {
    rewardSnapshotRef.current = next;
    setRewardSnapshot(next);
  }, []);

  const fetchRewards = useCallback(
    (id: string, isCancelled: () => boolean) =>
      campaignsApi.listRewards(id).then(
        (rewards) => {
          if (isCancelled()) {
            return;
          }
          const saved = rewards.map(fromRewardResponse);
          commitRewardSnapshot(snapshotOf(saved));
          setPlanning((previous) => ({ ...previous, rewards: saved }));
          setRewardsLoadError(null);
          setIsLoadingRewards(false);
        },
        (error: unknown) => {
          if (isCancelled()) {
            return;
          }
          setRewardsLoadError(mapRewardPersistenceError(error));
          setIsLoadingRewards(false);
        },
      ),
    [commitRewardSnapshot],
  );

  const loadRewards = useCallback(
    (id: string) => {
      setIsLoadingRewards(true);
      setRewardsLoadError(null);
      return fetchRewards(id, () => false);
    },
    [fetchRewards],
  );

  useEffect(() => {
    if (!campaignId) {
      return;
    }

    let cancelled = false;
    const planRequestId = ++planRequestRef.current;

    // Rewards load for every campaign type: the type-change guard needs to know
    // whether saved rewards exist.
    void fetchRewards(campaignId, () => cancelled);

    void (async () => {
      const [campaignResult, planResult] = await Promise.allSettled([
        campaignsApi.getById(campaignId),
        campaignsApi.getPlan(campaignId),
      ]);
      if (cancelled) {
        return;
      }
      if (campaignResult.status === 'rejected') {
        setLoadError(mapCampaignCreateError(campaignResult.reason));
        setIsLoadingCampaign(false);
        return;
      }
      const campaign = campaignResult.value;
      setDraft(mapCampaignResponseToDraft(campaign));
      if (planRequestId === planRequestRef.current) {
        if (planResult.status === 'fulfilled') {
          setPlanning((previous) => ({
            ...previous,
            ...mapPlanResponseToPlanning(planResult.value),
          }));
          setPlanLoadError(null);
        } else {
          setPlanLoadError(
            getApiErrorMessage(planResult.reason, 'No se pudo cargar el plan y presupuesto guardado.'),
          );
        }
      }
      setIsPlanDirty(false);
      setCreatedCampaignId(campaign.id);
      setCampaignStatus(campaign.status);
      setCoverImageUrl(campaign.coverImageUrl);
      setCoverCleared(false);
      setIsDirty(false);
      setLoadError(null);
      const preferredStep = resumeStepRef.current;
      setCurrentStep(
        preferredStep ??
          (campaign.status === 'draft' || campaign.status === 'changes_requested' ? 2 : 8),
      );
      if (preferredStep) {
        resumeStepRef.current = null;
        onResumeStepConsumed?.();
      }
      setIsLoadingCampaign(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [campaignId, fetchRewards, onResumeStepConsumed]);

  useEffect(() => {
    if (currentStep !== 7) {
      return;
    }
    void refreshUser();
  }, [currentStep, refreshUser]);

  /** Only reachable while the plan failed to load, so there are no local plan edits to keep. */
  const retryPlanLoad = async () => {
    if (!createdCampaignId) {
      return;
    }
    const planRequestId = ++planRequestRef.current;
    setIsRetryingPlan(true);
    try {
      const plan = await campaignsApi.getPlan(createdCampaignId);
      if (planRequestId !== planRequestRef.current) {
        return;
      }
      setPlanning((previous) => ({ ...previous, ...mapPlanResponseToPlanning(plan) }));
      setIsPlanDirty(false);
      setPlanLoadError(null);
    } catch (error) {
      if (planRequestId === planRequestRef.current) {
        setPlanLoadError(
          getApiErrorMessage(error, 'No se pudo cargar el plan y presupuesto guardado.'),
        );
      }
    } finally {
      if (planRequestId === planRequestRef.current) {
        setIsRetryingPlan(false);
      }
    }
  };

  const rewardPlan = useMemo(
    () => planRewardSync(rewardSnapshot, planning.rewards, draft.campaignType),
    [rewardSnapshot, planning.rewards, draft.campaignType],
  );
  const rewardsPending = !rewardsLoadError && !isRewardSyncPlanEmpty(rewardPlan);
  const pendingRewardIds = useMemo(
    () =>
      new Set([
        ...rewardPlan.creates.map((reward) => reward.id),
        ...rewardPlan.updates.map((update) => update.id),
      ]),
    [rewardPlan],
  );
  const hasUnsavedChanges = isDirty || isPlanDirty || rewardsPending;

  const patchDraft = useCallback((patch: Partial<CampaignCreationDraft>) => {
    setDraft((previous) => ({ ...previous, ...patch }));
    if (patch.coverImage) {
      setCoverCleared(false);
    }
    setIsDirty(true);
    setSaveFeedback(null);
  }, []);

  const patchPlanning = useCallback((patch: Partial<CampaignPlanningDraft>) => {
    setPlanning((previous) => ({ ...previous, ...patch }));
    if (patch.activities || patch.budgetItems) {
      setIsPlanDirty(true);
    }
    if (patch.activities || patch.budgetItems || patch.rewards) {
      setSaveFeedback(null);
    }
  }, []);

  const handleHeaderNavigate = (itemId: string) => {
    if (itemId === 'panel') {
      onExit();
      return;
    }
    onNavigate?.(itemId);
  };

  const isEditableStatus =
    !campaignStatus ||
    campaignStatus === 'draft' ||
    campaignStatus === 'changes_requested';

  /**
   * One request at a time, updating the snapshot after each success. If one
   * fails, the local rewards stay as they are and a retry only sends what is
   * still pending; creates reuse the local UUID, so they are never duplicated.
   */
  const runRewardSync = async (
    targetCampaignId: string,
    phase: 'deletes' | 'upserts',
  ): Promise<boolean> => {
    if (rewardsLoadError) {
      return false;
    }
    const plan = planRewardSync(rewardSnapshotRef.current, planning.rewards, draft.campaignType);
    let changed = false;
    try {
      const rememberSaved = (mapped: ReturnType<typeof fromRewardResponse>) => {
        commitRewardSnapshot({ ...rewardSnapshotRef.current, [mapped.id]: mapped });
        setPlanning((previous) => ({
          ...previous,
          rewards: previous.rewards.map((item) => (item.id === mapped.id ? mapped : item)),
        }));
      };

      if (phase === 'deletes') {
        for (const rewardId of plan.deletes) {
          try {
            await campaignsApi.deleteReward(targetCampaignId, rewardId);
          } catch (error) {
            if (!(axios.isAxiosError(error) && error.response?.status === 404)) {
              const saved = rewardSnapshotRef.current[rewardId];
              if (saved) {
                setPlanning((previous) =>
                  previous.rewards.some((item) => item.id === rewardId)
                    ? previous
                    : { ...previous, rewards: [...previous.rewards, saved] },
                );
              }
              throw error;
            }
          }
          const next = { ...rewardSnapshotRef.current };
          delete next[rewardId];
          commitRewardSnapshot(next);
          changed = true;
        }
        return changed;
      }

      for (const { id, patch } of plan.updates) {
        const saved = await campaignsApi.updateReward(targetCampaignId, id, patch);
        rememberSaved(fromRewardResponse(saved));
        changed = true;
      }
      for (const reward of plan.creates) {
        const saved = await campaignsApi.createReward(targetCampaignId, {
          id: reward.id,
          ...toRewardPayload(reward),
        });
        rememberSaved(fromRewardResponse(saved));
        changed = true;
      }
      return changed;
    } catch (error) {
      throw new RewardSyncError(
        `${mapRewardPersistenceError(error)} Lo que sí se guardó se conserva; al reintentar solo se envía lo pendiente y no se duplican las recompensas ya creadas.`,
      );
    }
  };

  const persistDraftIfNeeded = async (): Promise<string | null> => {
    const keepsSavedRewards = planning.rewards.some((reward) => rewardSnapshotRef.current[reward.id]);
    if (draft.campaignType !== 'reward' && keepsSavedRewards) {
      setSubmitError(
        'Tu campaña tiene recompensas guardadas. Descártalas en el paso Recompensas antes de cambiar el tipo de campaña.',
      );
      return null;
    }

    let rewardsChanged = false;
    if (createdCampaignId) {
      rewardsChanged = await runRewardSync(createdCampaignId, 'deletes');
    }

    let feedback: 'created' | 'updated' | null = null;
    const savedCampaignId =
      createdCampaignId && !isDirty ? createdCampaignId : await persistCampaign();
    if (!savedCampaignId) {
      return null;
    }
    if (savedCampaignId !== createdCampaignId) {
      feedback = 'created';
    } else if (isDirty) {
      feedback = 'updated';
    }

    if (isPlanDirty) {
      const savedPlan = await campaignsApi.savePlan(savedCampaignId, buildSavePlanRequest(planning));
      setPlanning((previous) => ({ ...previous, ...mapPlanResponseToPlanning(savedPlan) }));
      setIsPlanDirty(false);
      feedback = feedback ?? 'updated';
    }

    rewardsChanged = (await runRewardSync(savedCampaignId, 'upserts')) || rewardsChanged;
    if (feedback || rewardsChanged) {
      setSaveFeedback(feedback ?? 'updated');
    }
    return savedCampaignId;
  };

  const persistCampaign = async (): Promise<string | null> => {
    let nextCoverUrl = coverImageUrl;
    const newCoverFile = draft.coverImage;
    if (newCoverFile) {
      nextCoverUrl = await campaignsApi.uploadCoverImage(newCoverFile);
      setCoverImageUrl(nextCoverUrl);
      setCoverCleared(false);
      setDraft((previous) => ({ ...previous, coverImage: null }));
    }

    const coverOptions = newCoverFile
      ? { coverImageUrl: nextCoverUrl as string }
      : coverCleared
        ? { coverImageUrl: null, clearCover: true as const }
        : {};

    if (createdCampaignId) {
      const payload = buildUpdateCampaignRequest(draft, coverOptions);
      if (!payload) {
        setSubmitError('Revisa la información ingresada.');
        return null;
      }
      const updated = await campaignsApi.update(createdCampaignId, payload);
      setCreatedCampaignId(updated.id);
      setCampaignStatus(updated.status);
      setCoverImageUrl(updated.coverImageUrl);
      setCoverCleared(false);
      setIsDirty(false);
      return updated.id;
    }

    const payload = buildCreateCampaignRequest(draft, coverOptions);
    if (!payload) {
      setSubmitError('Revisa la información ingresada.');
      return null;
    }
    const created = await campaignsApi.create(payload);
    setCreatedCampaignId(created.id);
    setCampaignStatus(created.status);
    setCoverImageUrl(created.coverImageUrl);
    setCoverCleared(false);
    setIsDirty(false);
    return created.id;
  };

  const describeSaveError = (error: unknown): string =>
    error instanceof RewardSyncError ? error.message : mapCampaignCreateError(error);

  const handleSaveCampaign = async (): Promise<string | null> => {
    if (!isEditableStatus) {
      setSubmitError('Esta campaña ya no se puede editar como borrador.');
      return null;
    }

    if (submitLockRef.current || isSubmitting) {
      return null;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      return await persistDraftIfNeeded();
    } catch (error) {
      setSubmitError(describeSaveError(error));
      return null;
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleGoToVerification = async () => {
    if (!onGoToVerification || isOpeningVerification) {
      return;
    }

    setVerificationNavError(null);
    setIsOpeningVerification(true);

    try {
      let campaignIdForReturn = createdCampaignId;
      if (isEditableStatus && (hasUnsavedChanges || !campaignIdForReturn)) {
        campaignIdForReturn = await handleSaveCampaign();
        if (!campaignIdForReturn) {
          setVerificationNavError(
            'Guarda el borrador de la campaña antes de ir a verificación para no perder el progreso.',
          );
          return;
        }
      }

      if (!campaignIdForReturn) {
        setVerificationNavError(
          'Guarda el borrador de la campaña antes de ir a verificación para no perder el progreso.',
        );
        return;
      }

      onGoToVerification(campaignIdForReturn);
    } finally {
      setIsOpeningVerification(false);
    }
  };

  const handleToggleRewardActive = async (rewardId: string, isActive: boolean) => {
    if (!createdCampaignId || togglingRewardId) {
      return;
    }
    if (!rewardSnapshotRef.current[rewardId]) {
      setSubmitError('Guarda el borrador antes de activar o desactivar esta recompensa.');
      return;
    }

    setTogglingRewardId(rewardId);
    setSubmitError(null);
    try {
      const saved = await campaignsApi.setRewardActive(createdCampaignId, rewardId, isActive);
      const mapped = fromRewardResponse(saved);
      commitRewardSnapshot({ ...rewardSnapshotRef.current, [mapped.id]: mapped });
      setPlanning((previous) => ({
        ...previous,
        rewards: previous.rewards.map((item) =>
          item.id === mapped.id
            ? { ...item, isActive: mapped.isActive, quantityClaimed: mapped.quantityClaimed }
            : item,
        ),
      }));
    } catch (error) {
      setSubmitError(mapRewardPersistenceError(error));
    } finally {
      setTogglingRewardId(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!isEditableStatus) {
      setSubmitError('Esta campaña ya no se puede enviar a revisión.');
      return;
    }
    if (submitLockRef.current || isSubmitting) {
      return;
    }

    if (rewardsLoadError) {
      setSubmitError('Primero recupera las recompensas guardadas desde el paso Recompensas.');
      return;
    }
    if (planLoadError) {
      setSubmitError('Primero recupera el plan y presupuesto desde el paso Plan y presupuesto.');
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const campaignId = await persistDraftIfNeeded();
      if (!campaignId) {
        return;
      }
      if (draft.campaignType === 'reward' && planning.rewards.length === 0) {
        setSubmitError(
          'Una campaña de recompensas necesita al menos una recompensa guardada para enviarse a revisión.',
        );
        return;
      }

      const submitted = await campaignsApi.submitReview(campaignId);
      setCreatedCampaignId(submitted.id);
      setCampaignStatus(submitted.status);
      setSaveFeedback('submitted');
      setIsDirty(false);
    } catch (error) {
      setSubmitError(describeSaveError(error));
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    if (isLoadingCampaign) {
      return <p>Cargando campaña…</p>;
    }
    if (loadError) {
      return (
        <div>
          <p role="alert">{loadError}</p>
          <button type="button" onClick={onExit}>
            Volver al panel
          </button>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <StepCampaignType
            draft={draft}
            onChangeType={(value: CampaignTypeValue) => patchDraft({ campaignType: value })}
            onContinue={() => setCurrentStep(2)}
            onBack={onExit}
          />
        );
      case 2:
        return (
          <StepGeneralInfo
            draft={draft}
            existingCoverImageUrl={coverCleared ? null : coverImageUrl}
            onChange={patchDraft}
            onClearExistingCover={() => {
              setCoverImageUrl(null);
              setCoverCleared(true);
              setIsDirty(true);
              setSaveFeedback(null);
            }}
            onPrevious={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        );
      case 3:
        return (
          <StepStoryImpact
            draft={draft}
            onChange={patchDraft}
            onPrevious={() => setCurrentStep(2)}
            onNext={() => setCurrentStep(4)}
          />
        );
      case 4:
        return (
          <StepPlanBudget
            planning={planning}
            goalAmount={draft.goalAmount}
            loadError={planLoadError}
            isRetryingLoad={isRetryingPlan}
            onRetryLoad={() => void retryPlanLoad()}
            onChange={patchPlanning}
            onPrevious={() => setCurrentStep(3)}
            onNext={() => setCurrentStep(5)}
          />
        );
      case 5:
        return (
          <StepFunding
            draft={draft}
            onChange={patchDraft}
            onPrevious={() => setCurrentStep(4)}
            onNext={() => setCurrentStep(6)}
            onSubmit={() => {
              void handleSaveCampaign();
            }}
            isSubmitting={isSubmitting}
            createdCampaignId={createdCampaignId}
            submitError={submitError}
            isDirty={hasUnsavedChanges}
            saveFeedback={saveFeedback === 'submitted' ? null : saveFeedback}
            disableEdit={!isEditableStatus}
          />
        );
      case 6:
        return (
          <StepRewards
            campaignType={draft.campaignType}
            rewards={planning.rewards}
            pendingRewardIds={pendingRewardIds}
            persistedRewardIds={new Set(Object.keys(rewardSnapshot))}
            togglingRewardId={togglingRewardId}
            onToggleActive={(rewardId, isActive) => {
              void handleToggleRewardActive(rewardId, isActive);
            }}
            hasPendingChanges={rewardsPending}
            isLoading={isLoadingRewards}
            loadError={rewardsLoadError}
            onRetryLoad={
              createdCampaignId ? () => void loadRewards(createdCampaignId) : undefined
            }
            disableEdit={!isEditableStatus || isLoadingRewards || Boolean(rewardsLoadError)}
            isSubmitting={isSubmitting}
            submitError={submitError}
            saveFeedback={saveFeedback === 'submitted' ? null : saveFeedback}
            onSave={() => {
              void handleSaveCampaign();
            }}
            onChange={patchPlanning}
            onChangeCampaignType={() => setCurrentStep(1)}
            onPrevious={() => setCurrentStep(5)}
            onNext={() => setCurrentStep(7)}
          />
        );
      case 7:
        return (
          <StepKycStatus
            kycStatus={user?.kycStatus}
            isOpeningVerification={isOpeningVerification}
            verificationError={verificationNavError}
            onGoToVerification={() => {
              void handleGoToVerification();
            }}
            onPrevious={() => setCurrentStep(6)}
            onNext={() => setCurrentStep(8)}
          />
        );
      case 8:
        return (
          <StepFinalReview
            draft={draft}
            planning={planning}
            pendingRewardIds={pendingRewardIds}
            rewardsLoadError={rewardsLoadError}
            isLoadingRewards={isLoadingRewards}
            planLoadError={planLoadError}
            campaignStatus={campaignStatus}
            kycStatus={user?.kycStatus}
            coverImageUrl={coverImageUrl}
            isSubmitting={isSubmitting}
            isDirty={hasUnsavedChanges}
            createdCampaignId={createdCampaignId}
            submitError={submitError}
            saveFeedback={saveFeedback}
            onPrevious={() => setCurrentStep(7)}
            onEditStep={setCurrentStep}
            onSaveDraft={() => {
              void handleSaveCampaign();
            }}
            onSubmitReview={() => {
              void handleSubmitReview();
            }}
          />
        );
    }
  };

  return (
    <DashboardLayout
      variant="creator"
      activeItem="creator-projects"
      userName={user?.fullName ?? 'Creador'}
      onNavigate={handleHeaderNavigate}
      onLogout={onLogout}
      onSearchSubmit={onSearchProjects}
    >
      <div className="campaign-creation-wizard">{renderCurrentStep()}</div>
    </DashboardLayout>
  );
}
