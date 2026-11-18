export const CAMPAIGN_REVIEW_REPOSITORY_PORT = Symbol('CAMPAIGN_REVIEW_REPOSITORY_PORT');

export type CampaignReviewAction = 'approved' | 'rejected' | 'changes_requested';

export interface CampaignReviewSectionNotes {
  generalInfo?: string;
  storyImpact?: string;
  planBudget?: string;
  funding?: string;
  cover?: string;
  rewards?: string;
  other?: string;
}

export interface CampaignReviewRecord {
  id: string;
  campaignId: string;
  reviewerUserId: string;
  reviewerFullName: string | null;
  reviewerEmail: string | null;
  action: CampaignReviewAction;
  reason: string | null;
  sectionNotes: CampaignReviewSectionNotes | null;
  createdAt: Date;
}

export interface SaveCampaignReviewCommand {
  campaignId: string;
  reviewerUserId: string;
  action: CampaignReviewAction;
  reason?: string | null;
  sectionNotes?: CampaignReviewSectionNotes | null;
}

export interface CampaignReviewRepositoryPort {
  save(command: SaveCampaignReviewCommand): Promise<CampaignReviewRecord>;
  findByCampaignId(campaignId: string): Promise<CampaignReviewRecord[]>;
}

export function formatSectionNotesAsText(
  notes?: CampaignReviewSectionNotes | null,
): string | null {
  if (!notes) return null;
  const labels: Record<keyof CampaignReviewSectionNotes, string> = {
    cover: 'Portada',
    generalInfo: 'Información general',
    storyImpact: 'Historia e impacto',
    planBudget: 'Plan y presupuesto',
    funding: 'Financiamiento',
    rewards: 'Recompensas',
    other: 'Otras observaciones',
  };
  const lines: string[] = [];
  for (const key of Object.keys(labels) as Array<keyof CampaignReviewSectionNotes>) {
    const value = notes[key]?.trim();
    if (value) {
      lines.push(`${labels[key]}: ${value}`);
    }
  }
  return lines.length > 0 ? lines.join('\n') : null;
}

export function hasSectionNotes(notes?: CampaignReviewSectionNotes | null): boolean {
  if (!notes) return false;
  return Object.values(notes).some((value) => typeof value === 'string' && value.trim().length > 0);
}

export function normalizeSectionNotes(
  notes?: CampaignReviewSectionNotes | null,
): CampaignReviewSectionNotes | null {
  if (!notes) return null;
  const normalized: CampaignReviewSectionNotes = {};
  for (const [key, value] of Object.entries(notes) as Array<
    [keyof CampaignReviewSectionNotes, string | undefined]
  >) {
    const trimmed = value?.trim();
    if (trimmed) normalized[key] = trimmed;
  }
  return Object.keys(normalized).length > 0 ? normalized : null;
}
