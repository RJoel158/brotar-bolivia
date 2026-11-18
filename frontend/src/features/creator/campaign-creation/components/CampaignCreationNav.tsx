import { WIZARD_NAV_ITEMS, type WizardStep } from '../types.ts';
import './CampaignCreationNav.css';

export interface CampaignCreationNavProps {
  currentStep: WizardStep;
}

export function CampaignCreationNav({ currentStep }: CampaignCreationNavProps) {
  return (
    <aside className="campaign-creation-nav" aria-label="Pasos de la campaña">
      <p className="campaign-creation-nav__title">Nueva campaña</p>
      <ol className="campaign-creation-nav__list">
        {WIZARD_NAV_ITEMS.map((item) => {
          const isCurrent = currentStep === item.step;
          const isUpcoming = item.step > currentStep;

          return (
            <li key={item.id}>
              <span
                className={[
                  'campaign-creation-nav__item',
                  isCurrent ? 'is-current' : '',
                  isUpcoming ? 'is-upcoming' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
