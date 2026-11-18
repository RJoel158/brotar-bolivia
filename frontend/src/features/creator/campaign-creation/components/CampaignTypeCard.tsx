import './CampaignTypeCard.css';

export interface CampaignTypeCardProps<T extends string> {
  value: T;
  title: string;
  description: string;
  selected: boolean;
  onSelect: (value: T) => void;
}

export function CampaignTypeCard<T extends string>({
  value,
  title,
  description,
  selected,
  onSelect,
}: CampaignTypeCardProps<T>) {
  return (
    <button
      type="button"
      className={`campaign-type-card ${selected ? 'is-selected' : ''}`}
      onClick={() => onSelect(value)}
      aria-pressed={selected}
    >
      <span className="campaign-type-card__mark" aria-hidden="true" />
      <span className="campaign-type-card__body">
        <span className="campaign-type-card__title">{title}</span>
        <span className="campaign-type-card__description">{description}</span>
      </span>
    </button>
  );
}
