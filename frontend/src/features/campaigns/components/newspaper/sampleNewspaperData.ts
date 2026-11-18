import type { CampaignResponse, CampaignUpdateItem } from '../../../../shared/api/campaignsApi.ts';
import type { NewspaperBlock } from './types.ts';

export function createInitialNewspaperBlocks(
  campaign: CampaignResponse,
  updates: CampaignUpdateItem[] = [],
): NewspaperBlock[] {
  const blocks: NewspaperBlock[] = [];

  // 1. Headline
  blocks.push({
    id: 'block-headline-1',
    type: 'headline',
    kicker: `DIARIO DE IMPACTO • ${campaign.category.toUpperCase()}`,
    title: campaign.title,
    subtitle: campaign.shortSummary || 'Una iniciativa ciudadana comprometida con la regeneración y el bienestar ecológico.',
  });

  // 2. Lead Paragraph
  if (campaign.shortSummary) {
    blocks.push({
      id: 'block-lead-1',
      type: 'lead_paragraph',
      text: campaign.shortSummary,
    });
  }

  // 3. Two columns: El Desafío y La Estrategia
  blocks.push({
    id: 'block-two-cols-1',
    type: 'two_columns',
    col1Title: 'El Desafío Socio-Ambiental',
    col1Text:
      campaign.problem ||
      'Durante años, la zona ha enfrentado presiones ecológicas que exigen una intervención activa, participativa y sostenible para recuperar el equilibrio natural.',
    col2Title: 'Nuestra Estrategia de Acción',
    col2Text:
      campaign.solution ||
      'Desarrollamos soluciones regenerativas directas junto a la comunidad local, garantizando resultados medibles y transparencia en cada etapa.',
  });

  // 4. Pull Quote
  blocks.push({
    id: 'block-quote-1',
    type: 'pull_quote',
    quote: 'La tierra no necesita que la salvemos con palabras, sino que la cuidemos con hechos cotidianos.',
    attribution: `Iniciativa impulsada por ${campaign.creatorName || 'el equipo de Brotar'}`,
  });

  // 5. Featured Image (si tiene cover image)
  if (campaign.coverImageUrl) {
    blocks.push({
      id: 'block-image-1',
      type: 'image_feature',
      imageUrl: campaign.coverImageUrl,
      caption: `Evidencia fotográfica del proyecto en ${campaign.location || 'la comunidad local'}.`,
      layout: 'wide',
    });
  }

  // 6. Impact Metrics Grid
  blocks.push({
    id: 'block-metrics-1',
    type: 'metrics_grid',
    title: 'Impacto Proyectado y Metas del Proyecto',
    items: [
      {
        label: 'Meta de Recaudación',
        value: `${campaign.currency || 'BOB'} ${Number(campaign.goalAmount).toLocaleString()}`,
        description: 'Fondos requeridos para la fase actual',
      },
      {
        label: 'Progreso Financiero',
        value: `${campaign.currentAmount ? Math.round((Number(campaign.currentAmount) / Number(campaign.goalAmount)) * 100) : 0}%`,
        description: 'Financiamiento alcanzado a la fecha',
      },
      {
        label: 'Comunidad Activa',
        value: '100% Verde',
        description: 'Transparencia y trazabilidad garantizada',
      },
    ],
  });

  // 7. Recent Bulletin (si hay updates)
  if (updates.length > 0) {
    const latest = updates[0];
    blocks.push({
      id: 'block-bulletin-1',
      type: 'bulletin',
      badge: 'CABLE DE NOTICIAS',
      date: new Date(latest.createdAt).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      title: latest.title,
      body: latest.body,
    });
  }

  return blocks;
}
