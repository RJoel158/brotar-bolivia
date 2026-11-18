// Institutional Green Header Component
import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import './HeaderGreen.css';
import { Leaf, Search, Bell, Menu, X, User as UserIcon, LogOut, LayoutDashboard, FolderKanban, Building2, UserCircle, ShieldCheck } from 'lucide-react';
import { Button } from '../../ui/Button/index.ts';

export type HeaderVariant = 'public' | 'creator' | 'sponsor' | 'admin';

export interface HeaderNavItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface HeaderProps {
  variant?: HeaderVariant;
  activeItem?: string;
  userName?: string;
  userRoleLabel?: string;
  userRole?: string;
  isAuthenticated?: boolean;
  onNavigate?: (itemId: string) => void;
  onLogout?: () => void;
  onSearchSubmit?: (query: string) => void;
  className?: string;
}

const NAV_BY_VARIANT: Record<HeaderVariant, HeaderNavItem[]> = {
  public: [
    { id: 'explore-projects', label: 'Explorar' },
    { id: 'how-it-works', label: 'Cómo funciona' },
    { id: 'sponsor', label: 'Tu impacto' },
  ],
  creator: [
    { id: 'creator', label: 'Mi panel' },
    { id: 'creator-projects', label: 'Mis proyectos' },
    { id: 'creator-verification', label: 'Verificación' },
    { id: 'explore-feed', label: 'Explorar' },
  ],
  sponsor: [
    { id: 'sponsor', label: 'Panel' },
    { id: 'explore-feed', label: 'Explorar' },
  ],
  admin: [
    { id: 'administration', label: 'Revisión y Verificación' },
  ],
};

const ROLE_LABEL: Record<HeaderVariant, string> = {
  public: '',
  creator: 'Creador',
  sponsor: 'Patrocinador',
  admin: 'Administración',
};

const SEARCH_PLACEHOLDER: Record<HeaderVariant, string> = {
  public: 'Buscar proyectos...',
  creator: 'Buscar en mis proyectos...',
  sponsor: 'Buscar proyectos...',
  admin: 'Buscar proyectos...',
};

export const Header: FC<HeaderProps> = ({
  variant = 'public',
  activeItem,
  userName = 'Usuario',
  userRoleLabel,
  userRole,
  isAuthenticated = false,
  onNavigate,
  onLogout,
  onSearchSubmit,
  className = '',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  const items = NAV_BY_VARIANT[variant] || NAV_BY_VARIANT.public;
  const roleLabel = userRoleLabel ?? ROLE_LABEL[variant];
  const isPublic = variant === 'public';
  const isAdmin = variant === 'admin' || userRole === 'admin';
  const isCreatorRole = userRole === 'creator' || variant === 'creator';
  const isSponsorRole = userRole === 'sponsor' || (!isCreatorRole && !isAdmin);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNav = (id: string) => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    onNavigate?.(id);
  };

  const searchPlaceholder = SEARCH_PLACEHOLDER[variant] ?? SEARCH_PLACEHOLDER.public;

  /** With `onSearchSubmit` the page owns the search; otherwise it opens Explorar. */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    if (onSearchSubmit) {
      setIsMobileMenuOpen(false);
      setIsUserMenuOpen(false);
      onSearchSubmit(query);
      return;
    }
    handleNav('explore-projects');
  };

  const userInitials = (userName || 'AM')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'AM';

  return (
    <header
      className={[
        'brotar-header',
        `brotar-header--${variant}`,
        isAdmin ? 'brotar-header--admin' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="brotar-header__inner">
        {/* Left: Brand Logo */}
        <button
          type="button"
          className="brotar-header__brand"
          onClick={() => handleNav(isPublic ? 'home' : variant === 'creator' ? 'creator' : 'home')}
          aria-label="Brotar inicio"
        >
          <span className="brotar-header__logo" aria-hidden="true">
            <Leaf size={18} strokeWidth={2.4} />
          </span>
          <span className="brotar-header__brand-name">
            brotar<span className="brand-dot">.</span>
          </span>
        </button>

        {/* Center: Desktop Navigation Links */}
        <nav className="brotar-header__nav" aria-label="Navegación principal">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`brotar-header__link ${activeItem === item.id ? 'is-active' : ''} ${item.disabled ? 'is-disabled' : ''}`}
              onClick={() => {
                if (!item.disabled) {
                  handleNav(item.id);
                }
              }}
              disabled={item.disabled}
              title={item.disabled ? 'Próximamente' : undefined}
              aria-disabled={item.disabled || undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="brotar-header__actions">
          {/* Desktop Search Pill */}
          <form className="brotar-header__desktop-search" onSubmit={handleSearchSubmit}>
            <Search size={15} className="brotar-header__search-icon" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="brotar-header__search-input"
            />
            {searchQuery ? (
              <button
                type="button"
                className="brotar-header__search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
              >
                <X size={13} />
              </button>
            ) : null}
          </form>

          {/* Notification Bell */}
          <button
            type="button"
            className="brotar-header__bell-btn"
            aria-label="Notificaciones"
            onClick={() => handleNav(isAuthenticated ? 'explore-projects' : 'login')}
          >
            <Bell size={18} />
            <span className="brotar-header__bell-dot" />
          </button>

          {/* Desktop User Profile or Auth Buttons */}
          {isAuthenticated ? (
            <div className="brotar-header__user-container" ref={userMenuRef}>
              <button
                type="button"
                className="brotar-header__user-pill"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
              >
                <span className="brotar-header__avatar" aria-hidden="true">
                  {userInitials}
                </span>
                <span className="brotar-header__user-pill-label">
                  Mi perfil
                </span>
              </button>

              {isUserMenuOpen ? (
                <div className="brotar-header__dropdown" role="menu">
                  <div className="brotar-header__dropdown-header">
                    <p className="brotar-header__dropdown-name">{userName}</p>
                    {roleLabel ? (
                      <p className="brotar-header__dropdown-role">{roleLabel}</p>
                    ) : null}
                  </div>

                  <div className="brotar-header__dropdown-divider" />

                  <button
                    type="button"
                    className="brotar-header__dropdown-item"
                    onClick={() => handleNav('profile')}
                  >
                    <UserCircle size={15} />
                    <span>Mi Perfil</span>
                  </button>

                  <button
                    type="button"
                    className="brotar-header__dropdown-item"
                    onClick={() => handleNav('organizations')}
                  >
                    <Building2 size={15} />
                    <span>Mis Organizaciones</span>
                  </button>

                  {isCreatorRole && (
                    <>
                      <button
                        type="button"
                        className="brotar-header__dropdown-item"
                        onClick={() => handleNav('creator')}
                      >
                        <LayoutDashboard size={15} />
                        <span>Panel de Creador</span>
                      </button>

                      <button
                        type="button"
                        className="brotar-header__dropdown-item"
                        onClick={() => handleNav('creator-projects')}
                      >
                        <FolderKanban size={15} />
                        <span>Mis proyectos</span>
                      </button>
                    </>
                  )}

                  {isSponsorRole && (
                    <button
                      type="button"
                      className="brotar-header__dropdown-item"
                      onClick={() => handleNav('sponsor')}
                    >
                      <UserIcon size={15} />
                      <span>Mi impacto</span>
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      className="brotar-header__dropdown-item"
                      onClick={() => handleNav('administration')}
                    >
                      <ShieldCheck size={15} />
                      <span>Panel de Administración</span>
                    </button>
                  )}

                  <div className="brotar-header__dropdown-divider" />

                  {onLogout ? (
                    <button
                      type="button"
                      className="brotar-header__dropdown-item brotar-header__dropdown-item--danger"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                    >
                      <LogOut size={15} />
                      <span>Cerrar sesión</span>
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="brotar-header__desktop-auth">
              <Button variant="tertiary" onClick={() => handleNav('login')}>
                Iniciar sesión
              </Button>
              <Button variant="primary" onClick={() => handleNav('register')}>
                Crear cuenta
              </Button>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="brotar-header__hamburger"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {isMobileMenuOpen ? (
        <div className="brotar-header__mobile-drawer">
          <form className="brotar-header__mobile-search" onSubmit={handleSearchSubmit}>
            <Search size={16} className="brotar-header__mobile-search-icon" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="brotar-header__mobile-search-input"
            />
          </form>

          <nav className="brotar-header__mobile-nav">
            <button
              type="button"
              className={`brotar-header__mobile-link ${activeItem === 'home' ? 'is-active' : ''}`}
              onClick={() => handleNav('home')}
            >
              Inicio
            </button>
            <button
              type="button"
              className={`brotar-header__mobile-link ${activeItem === 'explore-projects' ? 'is-active' : ''}`}
              onClick={() => handleNav('explore-projects')}
            >
              Explorar proyectos
            </button>
            <button
              type="button"
              className={`brotar-header__mobile-link ${activeItem === 'how-it-works' ? 'is-active' : ''}`}
              onClick={() => handleNav('how-it-works')}
            >
              Cómo funciona
            </button>
            <button
              type="button"
              className={`brotar-header__mobile-link ${activeItem === 'for-creators' ? 'is-active' : ''}`}
              onClick={() => handleNav('for-creators')}
            >
              Para creadores
            </button>

            {isAuthenticated ? (
              <>
                <div className="brotar-header__mobile-divider" />
                <button
                  type="button"
                  className="brotar-header__mobile-link"
                  onClick={() => handleNav('profile')}
                >
                  Mi Perfil
                </button>
                <button
                  type="button"
                  className="brotar-header__mobile-link"
                  onClick={() => handleNav('organizations')}
                >
                  Mis Organizaciones
                </button>
                {isCreatorRole && (
                  <>
                    <button
                      type="button"
                      className="brotar-header__mobile-link"
                      onClick={() => handleNav('creator')}
                    >
                      Panel de Creador
                    </button>
                    <button
                      type="button"
                      className="brotar-header__mobile-link"
                      onClick={() => handleNav('creator-projects')}
                    >
                      Mis proyectos
                    </button>
                  </>
                )}
                {isSponsorRole && (
                  <button
                    type="button"
                    className="brotar-header__mobile-link"
                    onClick={() => handleNav('sponsor')}
                  >
                    Mi impacto
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    className="brotar-header__mobile-link"
                    onClick={() => handleNav('administration')}
                  >
                    Panel de Administración
                  </button>
                )}
                {onLogout ? (
                  <button
                    type="button"
                    className="brotar-header__mobile-link brotar-header__mobile-link--danger"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout();
                    }}
                  >
                    Cerrar sesión
                  </button>
                ) : null}
              </>
            ) : (
              <div className="brotar-header__mobile-auth">
                <Button variant="tertiary" fullWidth onClick={() => handleNav('login')}>
                  Iniciar sesión
                </Button>
                <Button variant="primary" fullWidth onClick={() => handleNav('register')}>
                  Crear cuenta
                </Button>
              </div>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
};


