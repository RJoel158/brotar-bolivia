export type NewspaperBlockType =
  | 'headline'
  | 'lead_paragraph'
  | 'paragraph'
  | 'pull_quote'
  | 'image_feature'
  | 'two_columns'
  | 'bulletin'
  | 'metrics_grid';

export interface BaseNewspaperBlock {
  id: string;
  type: NewspaperBlockType;
}

export interface HeadlineBlock extends BaseNewspaperBlock {
  type: 'headline';
  kicker?: string; // Ej: "CRÓNICA AMBIENTAL" o "EDICIÓN ESPECIAL"
  title: string;
  subtitle?: string;
}

export interface LeadParagraphBlock extends BaseNewspaperBlock {
  type: 'lead_paragraph';
  text: string;
}

export interface ParagraphBlock extends BaseNewspaperBlock {
  type: 'paragraph';
  text: string;
}

export interface PullQuoteBlock extends BaseNewspaperBlock {
  type: 'pull_quote';
  quote: string;
  attribution?: string;
}

export interface ImageFeatureBlock extends BaseNewspaperBlock {
  type: 'image_feature';
  imageUrl: string;
  caption: string;
  layout?: 'wide' | 'centered';
}

export interface TwoColumnsBlock extends BaseNewspaperBlock {
  type: 'two_columns';
  col1Title: string;
  col1Text: string;
  col2Title: string;
  col2Text: string;
}

export interface BulletinBlock extends BaseNewspaperBlock {
  type: 'bulletin';
  badge: string; // Ej: "ÚLTIMA HORA" o "AVANCE"
  date: string;
  title: string;
  body: string;
}

export interface MetricsGridBlock extends BaseNewspaperBlock {
  type: 'metrics_grid';
  title?: string;
  items: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
}

export type NewspaperBlock =
  | HeadlineBlock
  | LeadParagraphBlock
  | ParagraphBlock
  | PullQuoteBlock
  | ImageFeatureBlock
  | TwoColumnsBlock
  | BulletinBlock
  | MetricsGridBlock;

export interface CampaignNewspaperEdition {
  editionNumber?: string;
  editionDate?: string;
  location?: string;
  blocks: NewspaperBlock[];
}
