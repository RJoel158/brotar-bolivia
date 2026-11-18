import type { FC } from 'react';
import { Home, Compass, Plus, Heart, User } from 'lucide-react';
import './BottomNavBar.css';

export interface BottomNavBarProps {
  activeRoute: string;
  onRouteChange: (route: string) => void;
  onOpenCreateMenu?: () => void;
  isAuthenticated?: boolean;
}

export const BottomNavBar: FC<BottomNavBarProps> = ({
  activeRoute,
  onRouteChange,
  onOpenCreateMenu,
  isAuthenticated = false,
}) => {
  const isExploreActive =
    activeRoute === 'explore-projects' ||
    activeRoute === 'explore-feed' ||
    activeRoute === 'explore-catalog' ||
    activeRoute === 'project-detail';

  const isProfileActive =
    activeRoute === 'profile' ||
    activeRoute === 'organizations' ||
    activeRoute === 'creator-projects' ||
    activeRoute === 'creator-verification' ||
    activeRoute === 'login' ||
    activeRoute === 'register';

  const handleFabClick = () => {
    if (onOpenCreateMenu) {
      onOpenCreateMenu();
    } else {
      onRouteChange(isAuthenticated ? 'creator-campaign-create' : 'login');
    }
  };

  return (
    <nav className="brotar-bottom-nav" aria-label="Navegación móvil inferior">
      <div className="brotar-bottom-nav__inner">
        <button
          type="button"
          className={`brotar-bottom-nav__item ${activeRoute === 'home' ? 'is-active' : ''}`}
          onClick={() => onRouteChange('home')}
        >
          <Home size={20} strokeWidth={activeRoute === 'home' ? 2.5 : 2} />
          <span>Inicio</span>
        </button>

        <button
          type="button"
          className={`brotar-bottom-nav__item ${isExploreActive ? 'is-active' : ''}`}
          onClick={() => onRouteChange('explore-feed')}
        >
          <Compass size={20} strokeWidth={isExploreActive ? 2.5 : 2} />
          <span>Explorar</span>
        </button>

        <div className="brotar-bottom-nav__fab-wrapper">
          <button
            type="button"
            className="brotar-bottom-nav__fab"
            onClick={handleFabClick}
            aria-label="Crear publicación o historia"
            title="Crear historia o proyecto"
          >
            <Plus size={24} strokeWidth={2.6} />
          </button>
        </div>

        <button
          type="button"
          className={`brotar-bottom-nav__item ${activeRoute === 'how-it-works' || activeRoute === 'sponsor' ? 'is-active' : ''}`}
          onClick={() => onRouteChange(isAuthenticated ? 'sponsor' : 'how-it-works')}
        >
          <Heart size={20} strokeWidth={activeRoute === 'sponsor' ? 2.5 : 2} />
          <span>Impacto</span>
        </button>

        <button
          type="button"
          className={`brotar-bottom-nav__item ${isProfileActive ? 'is-active' : ''}`}
          onClick={() => onRouteChange(isAuthenticated ? 'profile' : 'login')}
        >
          <User size={20} strokeWidth={isProfileActive ? 2.5 : 2} />
          <span>Perfil</span>
        </button>
      </div>
    </nav>
  );
};
