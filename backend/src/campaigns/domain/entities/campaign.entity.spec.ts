import { Campaign } from './campaign.entity';
import { CampaignStatus } from '../value-objects/campaign-status.vo';

describe('Campaign Domain Entity', () => {
  const validFutureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  const baseCommand = {
    title: 'Reforestación Bosque Nativo Sierra Verde',
    category: 'ambiental',
    campaignType: 'donation',
    fundingModel: 'flexible',
    goalAmount: 25000,
    ownerUserId: '11111111-1111-4111-8111-111111111111',
    endDate: validFutureDate,
    location: 'La Paz, Bolivia',
    shortSummary: 'Plantación comunitaria de especies autóctonas en la sierra.',
  };

  function toPublished(campaign: Campaign): void {
    campaign.submitForReview();
    campaign.approve();
    campaign.publish();
  }

  it('should create a valid draft campaign', () => {
    const campaign = Campaign.create(baseCommand);

    expect(campaign.getId()).toBeDefined();
    expect(campaign.getTitle()).toBe('Reforestación Bosque Nativo Sierra Verde');
    expect(campaign.getSlug()).toBeDefined();
    expect(campaign.getStatus().isDraft()).toBe(true);
    expect(campaign.getCurrentAmount()).toBe(0);
    expect(campaign.getCurrency()).toBe('BOB');
    expect(campaign.getProgressPercentage()).toBe(0);
  });

  it('should throw error when goalAmount is below minimum', () => {
    expect(() => {
      Campaign.create({
        ...baseCommand,
        title: 'Campaña Inválida',
        goalAmount: 5,
      });
    }).toThrow('La meta de recaudación debe ser de al menos 10 BOB.');
  });

  it('should throw error when category is invalid', () => {
    expect(() => {
      Campaign.create({
        ...baseCommand,
        title: 'Campaña Inválida',
        category: 'categoria-desconocida',
      });
    }).toThrow('Categoría inválida');
  });

  it('should update draft details without changing owner or slug', () => {
    const campaign = Campaign.create(baseCommand);
    const originalSlug = campaign.getSlug();

    campaign.updateDetails({
      title: 'Reforestación Sierra Verde Actualizada',
      problem: 'Erosión y pérdida de suelo.',
    });

    expect(campaign.getTitle()).toBe('Reforestación Sierra Verde Actualizada');
    expect(campaign.getProblem()).toBe('Erosión y pérdida de suelo.');
    expect(campaign.getSlug()).toBe(originalSlug);
    expect(campaign.getOwnerUserId()).toBe(baseCommand.ownerUserId);
    expect(campaign.isOwnedBy(baseCommand.ownerUserId)).toBe(true);
    expect(campaign.isEditable()).toBe(true);
  });

  it('should allow updates when status is changes_requested', () => {
    const campaign = Campaign.create(baseCommand);
    campaign.submitForReview();
    campaign.requestChanges('Ajusta el título y el resumen.');

    campaign.updateDetails({ title: 'Ajuste tras solicitud de cambios' });

    expect(campaign.getTitle()).toBe('Ajuste tras solicitud de cambios');
    expect(campaign.getStatus().getValue()).toBe('changes_requested');
  });

  it('should reject updates when the campaign is published', () => {
    const campaign = Campaign.create(baseCommand);
    toPublished(campaign);

    expect(() => {
      campaign.updateDetails({ title: 'No se puede editar publicada' });
    }).toThrow('No se puede editar una campaña en estado "published".');
  });

  it('should submit draft for review then approve and publish', () => {
    const campaign = Campaign.create(baseCommand);

    campaign.submitForReview();
    expect(campaign.getStatus().isPendingReview()).toBe(true);

    campaign.approve();
    expect(campaign.getStatus().isApproved()).toBe(true);

    campaign.publish();
    expect(campaign.getStatus().isPublished()).toBe(true);
    expect(campaign.getPublishedAt()).not.toBeNull();
  });

  it('should reject publish from draft', () => {
    const campaign = Campaign.create(baseCommand);

    expect(() => campaign.publish()).toThrow(
      'Solo se pueden publicar campañas en estado approved.',
    );
  });

  it('should reject approve from draft', () => {
    const campaign = Campaign.create(baseCommand);

    expect(() => campaign.approve()).toThrow(
      'Solo se pueden aprobar campañas en pending_review.',
    );
  });

  it('should accept funds and mark as completed when goal is reached', () => {
    const campaign = Campaign.create({
      ...baseCommand,
      title: 'Micro-Red Solar Rural',
      category: 'productivo',
      goalAmount: 1000,
      shortSummary: 'Instalación de paneles solares fotovoltaicos en zona rural.',
    });

    toPublished(campaign);
    expect(campaign.getStatus().isPublished()).toBe(true);

    campaign.addFunds(500);
    expect(campaign.getCurrentAmount()).toBe(500);
    expect(campaign.getProgressPercentage()).toBe(50);
    expect(campaign.getStatus().isPublished()).toBe(true);

    campaign.addFunds(500);
    expect(campaign.getCurrentAmount()).toBe(1000);
    expect(campaign.getProgressPercentage()).toBe(100);
    expect(campaign.getStatus().isCompleted()).toBe(true);
    expect(CampaignStatus.COMPLETED.equals(campaign.getStatus())).toBe(true);
  });
});
