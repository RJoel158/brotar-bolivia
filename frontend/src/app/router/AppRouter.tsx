import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Navbar, Footer, BottomNavBar, CreateChoiceModal } from '../../shared/index.ts';
import { CreateStoryModal } from '../../features/public/social-feed/components/CreateStoryModal.tsx';
import { AUTH_UNAUTHORIZED_EVENT } from '../../shared/api/apiClient.ts';
import {
  HomePage,
  ExploreSocialFeedPage,
  NotFound404Page,
  Forbidden403Page,
  ProjectDetailPage,
  HowItWorksPage,
  ForCreatorsPage,
  LoginPage,
  RegisterPage,
  RecoverPasswordPage,
  ForceChangePasswordPage,
  CampaignsPage,
  CreatorDashboardPage,
  CreatorProjectsPage,
  CreatorVerificationPage,
  CampaignCreationWizardPage,
  SponsorDashboardPage,
  AdminKycVerificationPage,
  ContributionCheckoutPage,
  ContributionTrackingPage,
  ProfilePage,
  TrustInfoPage,
} from '../../features/index.ts';
import { useAuth } from '../../features/auth/context/useAuth.ts';
import type { UserRole } from '../../shared/types/index.ts';
import {
  canAccessRoute,
  homeRouteForRole,
  isProtectedRoute,
} from '../../features/auth/utils/roleHome.ts';

const CREATOR_LAYOUT_ROUTES = new Set([
  'creator',
  'creator-projects',
  'creator-verification',
  'creator-campaign-create',
]);

interface RouteLocation {
  route: string;
  campaignId?: string | null;
  adminMenu?: string;
  detailBackRoute?: string;
  joinCode?: string | null;
  contributionId?: string | null;
  projectsQuery?: string | null;
  catalogQuery?: string | null;
  /** El checkout se abrio desde el detalle del proyecto: "volver" regresa en el historial. */
  cameFromDetail?: boolean;
}

function parseLocation(pathname: string, search: string): RouteLocation {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(search);

  if (cleanPath === '/' || cleanPath === '') {
    return { route: 'home' };
  }
  if (
    cleanPath === '/explorar/campanas' ||
    cleanPath === '/explorar/catalogo' ||
    (cleanPath === '/explorar' && searchParams.get('vista') === 'catalogo')
  ) {
    return { route: 'explore-catalog', catalogQuery: searchParams.get('q')?.trim() || null };
  }
  if (
    cleanPath === '/explorar' ||
    cleanPath === '/explore' ||
    cleanPath === '/explore-projects' ||
    cleanPath === '/feed'
  ) {
    return { route: 'explore-projects' };
  }
  if (cleanPath.startsWith('/proyectos/') || cleanPath.startsWith('/projects/')) {
    const parts = cleanPath.split('/');
    const campaignId = parts[2];
    return {
      route: 'project-detail',
      campaignId: campaignId || null,
      detailBackRoute: 'explore-projects',
    };
  }
  if (cleanPath === '/campanas' || cleanPath === '/campaigns') {
    return { route: 'campaigns' };
  }
  if (cleanPath === '/verificacion' || cleanPath === '/verification') {
    return { route: 'verification' };
  }
  if (cleanPath === '/preguntas-frecuentes' || cleanPath === '/faq') {
    return { route: 'faq' };
  }
  if (cleanPath === '/terminos' || cleanPath === '/terms') {
    return { route: 'terms' };
  }
  if (cleanPath === '/como-funciona' || cleanPath === '/how-it-works') {
    return { route: 'how-it-works' };
  }
  if (cleanPath === '/para-creadores' || cleanPath === '/for-creators') {
    return { route: 'for-creators' };
  }
  if (cleanPath === '/login' || cleanPath === '/iniciar-sesion') {
    return { route: 'login' };
  }
  if (cleanPath === '/registro' || cleanPath === '/register') {
    return { route: 'register' };
  }
  if (cleanPath === '/recuperar-password' || cleanPath === '/recover-password') {
    return { route: 'recover-password' };
  }
  if (
    cleanPath === '/cambiar-password' ||
    cleanPath === '/change-password' ||
    cleanPath === '/force-change-password'
  ) {
    return { route: 'force-change-password' };
  }
  if (cleanPath === '/creador' || cleanPath === '/creator') {
    return { route: 'creator' };
  }
  if (
    cleanPath === '/creador/proyectos' ||
    cleanPath === '/creator/projects' ||
    cleanPath === '/creator-projects'
  ) {
    return { route: 'creator-projects', projectsQuery: searchParams.get('q')?.trim() || null };
  }
  if (
    cleanPath === '/creador/verificacion' ||
    cleanPath === '/creator/verification' ||
    cleanPath === '/creator-verification'
  ) {
    return { route: 'creator-verification' };
  }
  if (
    cleanPath === '/creador/crear' ||
    cleanPath === '/creador/campanas/crear' ||
    cleanPath === '/creator-campaign-create'
  ) {
    const id = searchParams.get('id');
    return { route: 'creator-campaign-create', campaignId: id || null };
  }
  if (cleanPath === '/patrocinador' || cleanPath === '/sponsor') {
    return { route: 'sponsor' };
  }
  if (
    cleanPath === '/perfil' ||
    cleanPath === '/profile' ||
    cleanPath === '/mi-perfil'
  ) {
    return { route: 'profile' };
  }
  if (
    cleanPath === '/organizaciones' ||
    cleanPath === '/organizations' ||
    cleanPath === '/equipos' ||
    cleanPath === '/organizaciones/unirse' ||
    cleanPath === '/unirse'
  ) {
    const joinCode = searchParams.get('codigo') || searchParams.get('code') || searchParams.get('invite') || null;
    return { route: 'organizations', joinCode };
  }
  if (cleanPath.startsWith('/apoyar/')) {
    const parts = cleanPath.split('/');
    return {
      route: 'contribution-checkout',
      campaignId: parts[2] || null,
      detailBackRoute: 'explore-projects',
      contributionId: searchParams.get('aporte'),
    };
  }
  if (cleanPath.startsWith('/mis-aportes/')) {
    const parts = cleanPath.split('/');
    return {
      route: 'contribution-tracking',
      contributionId: parts[2] ? decodeURIComponent(parts[2]) : null,
    };
  }
  if (cleanPath === '/admin' || cleanPath === '/administration') {
    const menu = searchParams.get('menu');
    return { route: 'administration', adminMenu: menu || undefined };
  }
  if (cleanPath === '/404' || cleanPath === '/not-found') {
    return { route: 'not-found' };
  }
  if (cleanPath === '/403' || cleanPath === '/forbidden') {
    return { route: 'forbidden' };
  }

  return { route: 'not-found' };
}

function buildUrlPath(
  route: string,
  options?: {
    campaignId?: string | null;
    adminMenu?: string;
    joinCode?: string | null;
    contributionId?: string | null;
    projectsQuery?: string | null;
    catalogQuery?: string | null;
  },
): string {
  switch (route) {
    case 'home':
      return '/';
    case 'explore-projects':
    case 'explore-feed':
      return '/explorar';
    case 'explore-catalog':
      return options?.catalogQuery
        ? `/explorar/campanas?q=${encodeURIComponent(options.catalogQuery)}`
        : '/explorar/campanas';
    case 'verification':
      return '/verificacion';
    case 'faq':
      return '/preguntas-frecuentes';
    case 'terms':
      return '/terminos';
    case 'project-detail':
      return options?.campaignId ? `/proyectos/${options.campaignId}` : '/explorar';
    case 'campaigns':
      return '/campanas';
    case 'how-it-works':
      return '/como-funciona';
    case 'for-creators':
      return '/para-creadores';
    case 'login':
      return '/login';
    case 'register':
      return '/registro';
    case 'recover-password':
      return '/recuperar-password';
    case 'force-change-password':
      return '/cambiar-password';
    case 'creator':
      return '/creador';
    case 'creator-projects':
      return options?.projectsQuery
        ? `/creador/proyectos?q=${encodeURIComponent(options.projectsQuery)}`
        : '/creador/proyectos';
    case 'creator-verification':
      return '/creador/verificacion';
    case 'creator-campaign-create':
      return options?.campaignId ? `/creador/crear?id=${options.campaignId}` : '/creador/crear';
    case 'sponsor':
      return '/patrocinador';
    case 'profile':
      return '/perfil';
    case 'organizations':
      return options?.joinCode
        ? `/organizaciones/unirse?codigo=${encodeURIComponent(options.joinCode)}`
        : '/organizaciones';
    case 'contribution-checkout':
      if (!options?.campaignId) return '/explorar';
      return options.contributionId
        ? `/apoyar/${options.campaignId}?aporte=${encodeURIComponent(options.contributionId)}`
        : `/apoyar/${options.campaignId}`;
    case 'contribution-tracking':
      return options?.contributionId
        ? `/mis-aportes/${encodeURIComponent(options.contributionId)}`
        : '/patrocinador';
    case 'administration':
      return options?.adminMenu ? `/admin?menu=${options.adminMenu}` : '/admin';
    case 'not-found':
      return '/404';
    case 'forbidden':
      return '/403';
    default:
      return '/';
  }
}

function resolveAccessibleRoute(
  route: string,
  userRole: UserRole | undefined,
  isBootstrapping: boolean,
): string {
  if (isBootstrapping) {
    return route;
  }
  if (isProtectedRoute(route) && !canAccessRoute(route, userRole)) {
    return userRole ? 'forbidden' : 'login';
  }
  return route;
}

export const AppRouter: FC = () => {
  const { user, isAuthenticated, isBootstrapping, logout } = useAuth();

  // Initialize route from current browser window URL
  const initialLoc = typeof window !== 'undefined'
    ? parseLocation(window.location.pathname, window.location.search)
    : { route: 'home' };

  const [currentRoute, setCurrentRoute] = useState<string>(initialLoc.route);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(initialLoc.campaignId ?? null);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(
    initialLoc.route === 'creator-campaign-create' ? initialLoc.campaignId ?? null : null,
  );
  const [currentJoinCode, setCurrentJoinCode] = useState<string | null>(initialLoc.joinCode ?? null);
  const [detailBackRoute, setDetailBackRoute] = useState<string>(initialLoc.detailBackRoute ?? 'explore-projects');
  const [adminInitialMenu, setAdminInitialMenu] = useState<string | undefined>(initialLoc.adminMenu);
  const [resumeContributionId, setResumeContributionId] = useState<string | null>(
    initialLoc.contributionId ?? null,
  );
  const [creatorProjectsQuery, setCreatorProjectsQuery] = useState<string | null>(
    initialLoc.projectsQuery ?? null,
  );
  const [catalogQuery, setCatalogQuery] = useState<string | null>(initialLoc.catalogQuery ?? null);
  const [verificationReturnCampaignId, setVerificationReturnCampaignId] = useState<string | null>(
    null,
  );
  const [wizardResumeStep, setWizardResumeStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | null>(
    null,
  );
  const [isCreateChoiceOpen, setIsCreateChoiceOpen] = useState(false);
  const [isGlobalCreateStoryOpen, setIsGlobalCreateStoryOpen] = useState(false);

  const handleSelectStoryCreation = () => {
    if (!isAuthenticated) {
      navigate('login');
      return;
    }
    setIsGlobalCreateStoryOpen(true);
  };

  const handleSelectCampaignCreation = () => {
    navigate(isAuthenticated ? 'creator-campaign-create' : 'login');
  };

  const navigate = useCallback(
    (
      route: string,
      options?: {
        campaignId?: string | null;
        adminMenu?: string;
        joinCode?: string | null;
        backRoute?: string;
        replace?: boolean;
        contributionId?: string | null;
        projectsQuery?: string | null;
        catalogQuery?: string | null;
        role?: UserRole;
      },
    ) => {
      let targetRoute = route;
      const role = options?.role ?? user?.role;

      if (isProtectedRoute(route) && !canAccessRoute(route, role)) {
        targetRoute = role ? homeRouteForRole(role) : 'login';
      }

      const mustChange = Boolean(user?.mustChangePassword);
      const allowedWhileMustChange = new Set([
        'force-change-password',
        'login',
        'recover-password',
        'home',
      ]);
      if (mustChange && !allowedWhileMustChange.has(targetRoute)) {
        targetRoute = 'force-change-password';
      }

      if (targetRoute !== 'creator-campaign-create') {
        setEditingCampaignId(null);
      } else if (options?.campaignId !== undefined) {
        setEditingCampaignId(options.campaignId);
      }

      if (targetRoute === 'organizations') {
        setCurrentJoinCode(options?.joinCode ?? null);
      } else {
        setCurrentJoinCode(null);
      }

      if (targetRoute === 'project-detail' || targetRoute === 'contribution-checkout') {
        if (options?.campaignId) {
          setSelectedCampaignId(options.campaignId);
        }
        if (options?.backRoute) {
          setDetailBackRoute(options.backRoute);
        }
      }

      if (targetRoute === 'administration') {
        setAdminInitialMenu(options?.adminMenu);
      } else {
        setAdminInitialMenu(undefined);
      }

      const nextContributionId =
        targetRoute === 'contribution-checkout' || targetRoute === 'contribution-tracking'
          ? (options?.contributionId ?? null)
          : null;
      setResumeContributionId(nextContributionId);

      const nextProjectsQuery =
        targetRoute === 'creator-projects' ? options?.projectsQuery?.trim() || null : null;
      setCreatorProjectsQuery(nextProjectsQuery);

      const nextCatalogQuery =
        targetRoute === 'explore-catalog' ? options?.catalogQuery?.trim() || null : null;
      setCatalogQuery(nextCatalogQuery);

      // Si el checkout se abre desde el detalle, "Volver al proyecto" regresa en el
      // historial en vez de apilar otro detalle (evita el bucle detalle <-> apoyar).
      const cameFromDetail =
        targetRoute === 'contribution-checkout' && currentRoute === 'project-detail';

      setCurrentRoute(targetRoute);

      // Synchronize browser history and URL bar
      if (typeof window !== 'undefined') {
        const url = buildUrlPath(targetRoute, {
          campaignId:
            options?.campaignId ??
            (targetRoute === 'project-detail' || targetRoute === 'contribution-checkout'
              ? selectedCampaignId
              : undefined),
          adminMenu: options?.adminMenu,
          joinCode: options?.joinCode ?? (targetRoute === 'organizations' ? currentJoinCode : undefined),
          contributionId: nextContributionId,
          projectsQuery: nextProjectsQuery,
          catalogQuery: nextCatalogQuery,
        });

        const statePayload: RouteLocation = {
          route: targetRoute,
          campaignId: options?.campaignId ?? null,
          adminMenu: options?.adminMenu,
          joinCode: options?.joinCode ?? null,
          detailBackRoute: options?.backRoute ?? detailBackRoute,
          contributionId: nextContributionId,
          projectsQuery: nextProjectsQuery,
          catalogQuery: nextCatalogQuery,
          cameFromDetail,
        };

        if (options?.replace) {
          window.history.replaceState(statePayload, '', url);
        } else if (window.location.pathname + window.location.search !== url) {
          window.history.pushState(statePayload, '', url);
        }
      }
    },
    [user, selectedCampaignId, currentJoinCode, detailBackRoute, currentRoute],
  );

  // Listen to browser Back and Forward buttons (popstate event)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as RouteLocation | null;
      if (state && state.route) {
        setCurrentRoute(state.route);
        setSelectedCampaignId(state.campaignId ?? null);
        if (state.route === 'creator-campaign-create') {
          setEditingCampaignId(state.campaignId ?? null);
        } else {
          setEditingCampaignId(null);
        }
        setCurrentJoinCode(state.joinCode ?? null);
        setAdminInitialMenu(state.adminMenu);
        setResumeContributionId(state.contributionId ?? null);
        setCreatorProjectsQuery(state.projectsQuery ?? null);
        setCatalogQuery(state.catalogQuery ?? null);
        if (state.detailBackRoute) {
          setDetailBackRoute(state.detailBackRoute);
        }
      } else {
        const parsed = parseLocation(window.location.pathname, window.location.search);
        setCurrentRoute(parsed.route);
        setSelectedCampaignId(parsed.campaignId ?? null);
        if (parsed.route === 'creator-campaign-create') {
          setEditingCampaignId(parsed.campaignId ?? null);
        } else {
          setEditingCampaignId(null);
        }
        setCurrentJoinCode(parsed.joinCode ?? null);
        setAdminInitialMenu(parsed.adminMenu);
        setResumeContributionId(parsed.contributionId ?? null);
        setCreatorProjectsQuery(parsed.projectsQuery ?? null);
        setCatalogQuery(parsed.catalogQuery ?? null);
        if (parsed.detailBackRoute) {
          setDetailBackRoute(parsed.detailBackRoute);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Handle initial page load replaceState so current state is in history
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.history.state) {
      const url = buildUrlPath(currentRoute, {
        campaignId: selectedCampaignId,
        adminMenu: adminInitialMenu,
        joinCode: currentJoinCode,
        contributionId: resumeContributionId,
        projectsQuery: creatorProjectsQuery,
        catalogQuery,
      });
      window.history.replaceState(
        {
          route: currentRoute,
          campaignId: selectedCampaignId,
          adminMenu: adminInitialMenu,
          joinCode: currentJoinCode,
          detailBackRoute,
          contributionId: resumeContributionId,
          projectsQuery: creatorProjectsQuery,
          catalogQuery,
        },
        '',
        currentRoute === 'recover-password' ? url + window.location.hash : url,
      );
    }
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      if (currentRoute === 'recover-password') return;
      navigate('login', { replace: true });
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, [navigate, currentRoute]);

  useEffect(() => {
    if (isBootstrapping || !user?.mustChangePassword) {
      return;
    }
    if (currentRoute !== 'force-change-password' && currentRoute !== 'recover-password') {
      navigate('force-change-password', { replace: true });
    }
  }, [isBootstrapping, user?.mustChangePassword, currentRoute, navigate]);

  const handleLogout = () => {
    logout();
    navigate('home', { replace: true });
  };

  const openCampaignDetail = (campaignId: string, backRoute: string) => {
    navigate('project-detail', { campaignId, backRoute });
  };

  const handleSelectCampaign = (campaignId: string) => {
    openCampaignDetail(campaignId, 'explore-projects');
  };

  const clearVerificationWizardReturn = () => {
    setVerificationReturnCampaignId(null);
    setWizardResumeStep(null);
  };

  const handleCreatorNavigate = (itemId: string) => {
    if (itemId === 'panel' || itemId === 'creator') {
      clearVerificationWizardReturn();
      navigate('creator');
      return;
    }
    if (itemId === 'my-projects' || itemId === 'creator-projects') {
      clearVerificationWizardReturn();
      navigate('creator-projects');
      return;
    }
    if (itemId === 'verification' || itemId === 'creator-verification') {
      clearVerificationWizardReturn();
      navigate('creator-verification');
      return;
    }
    if (itemId === 'explore-feed' || itemId === 'explore-projects' || itemId === 'explorar') {
      clearVerificationWizardReturn();
      navigate('explore-feed');
      return;
    }
    if (itemId === 'profile' || itemId === 'perfil') {
      clearVerificationWizardReturn();
      navigate('profile');
      return;
    }
    if (itemId === 'organizations' || itemId === 'organizaciones' || itemId === 'equipos') {
      clearVerificationWizardReturn();
      navigate('organizations');
      return;
    }
    if (itemId === 'logout') {
      clearVerificationWizardReturn();
      handleLogout();
      return;
    }
    // Header links shared with other layouts (Explorar, Inicio, Cómo funciona...).
    clearVerificationWizardReturn();
    navigate(itemId);
  };

  const searchCreatorProjects = (query: string) => {
    navigate('creator-projects', { projectsQuery: query });
  };

  const openCreateCampaign = () => {
    navigate('creator-campaign-create');
  };

  const continueCampaign = (campaignId: string) => {
    navigate('creator-campaign-create', { campaignId });
  };

  const handleBackFromCheckout = () => {
    const state = (typeof window !== 'undefined' ? window.history.state : null) as RouteLocation | null;
    if (state?.cameFromDetail && window.history.length > 1) {
      window.history.back();
      return;
    }
    // Se entro directo a /apoyar: reemplazamos esta entrada para no dejar un bucle.
    navigate('project-detail', { campaignId: selectedCampaignId, replace: true });
  };

  const handleBackFromDetail = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      navigate(detailBackRoute);
    }
  };

  const activeRoute = resolveAccessibleRoute(currentRoute, user?.role, isBootstrapping);
  const usesCreatorLayout = CREATOR_LAYOUT_ROUTES.has(activeRoute);
  const isAdminRoute = activeRoute === 'administration';

  if (isBootstrapping) {
    return (
      <div className="brotar-app-layout auth-bootstrapping">
        <p>Cargando sesión…</p>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (activeRoute) {
      case 'home':
        return (
          <HomePage
            onNavigate={navigate}
            onSelectProject={(campaignId) => openCampaignDetail(campaignId, 'home')}
          />
        );
      case 'explore-projects':
      case 'explore-feed':
        return (
          <ExploreSocialFeedPage
            key="explore-feed"
            initialMode="feed"
            onSelectProject={handleSelectCampaign}
            onNavigate={navigate}
          />
        );
      case 'explore-catalog':
        return (
          <ExploreSocialFeedPage
            key="explore-catalog"
            initialMode="catalog"
            catalogQuery={catalogQuery}
            onSelectProject={handleSelectCampaign}
            onNavigate={navigate}
          />
        );
      case 'project-detail':
        return (
          <ProjectDetailPage
            campaignId={selectedCampaignId}
            onBack={handleBackFromDetail}
            onSponsor={() =>
              navigate('contribution-checkout', { campaignId: selectedCampaignId })
            }
          />
        );
      case 'contribution-checkout':
        return (
          <ContributionCheckoutPage
            key={`${selectedCampaignId ?? 'none'}:${resumeContributionId ?? 'new'}`}
            campaignId={selectedCampaignId}
            resumeContributionId={resumeContributionId}
            onBack={handleBackFromCheckout}
            onFinished={() => navigate('sponsor')}
          />
        );
      case 'contribution-tracking':
        return (
          <ContributionTrackingPage
            key={resumeContributionId ?? 'none'}
            contributionId={resumeContributionId}
            onBack={() => navigate('sponsor')}
            onOpenCampaign={(campaignId) =>
              navigate('project-detail', { campaignId, backRoute: 'sponsor' })
            }
            onResumeCheckout={(campaignId, contributionId) =>
              navigate('contribution-checkout', { campaignId, contributionId })
            }
          />
        );
      case 'how-it-works':
        return <HowItWorksPage />;
      case 'verification':
      case 'faq':
      case 'terms':
        return (
          <TrustInfoPage
            section={activeRoute as 'verification' | 'faq' | 'terms'}
            onNavigate={navigate}
          />
        );
      case 'for-creators':
        return (
          <ForCreatorsPage
            onStartCampaign={() =>
              navigate(
                isAuthenticated && user?.role === 'creator'
                  ? 'creator-campaign-create'
                  : 'register',
              )
            }
          />
        );
      case 'login':
        return (
          <LoginPage
            onNavigate={navigate}
            onBack={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                navigate('home');
              }
            }}
            onSuccess={(route, role) => navigate(route, { role })}
          />
        );
      case 'register':
        return (
          <RegisterPage
            onNavigate={navigate}
            onBack={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                navigate('home');
              }
            }}
            onSuccess={(route, role) => navigate(route, { role })}
          />
        );
      case 'recover-password':
        return (
          <RecoverPasswordPage
            onNavigate={navigate}
            onBack={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                navigate('login');
              }
            }}
          />
        );
      case 'force-change-password':
        return (
          <ForceChangePasswordPage
            onSuccess={(route, role) => navigate(route, { role, replace: true })}
            onLogout={() => navigate('login', { replace: true })}
          />
        );
      case 'campaigns':
        return (
          <CampaignsPage
            onSelectCampaign={(campaignId) => openCampaignDetail(campaignId, 'campaigns')}
          />
        );
      case 'creator':
        return (
          <CreatorDashboardPage
            onCreateProject={openCreateCampaign}
            onContinueCampaign={continueCampaign}
            onViewCampaign={(campaignId) => openCampaignDetail(campaignId, 'creator')}
            onGoToProjects={() => navigate('creator-projects')}
            onGoToVerification={() => navigate('creator-verification')}
            onNavigate={handleCreatorNavigate}
            onLogout={handleLogout}
            onSearchProjects={searchCreatorProjects}
          />
        );
      case 'creator-projects':
        return (
          <CreatorProjectsPage
            searchQuery={creatorProjectsQuery}
            onCreateProject={openCreateCampaign}
            onContinueCampaign={continueCampaign}
            onViewCampaign={(campaignId) =>
              openCampaignDetail(campaignId, 'creator-projects')
            }
            onNavigate={handleCreatorNavigate}
            onLogout={handleLogout}
            onSearchProjects={searchCreatorProjects}
          />
        );
      case 'creator-verification':
        return (
          <CreatorVerificationPage
            onNavigate={handleCreatorNavigate}
            onLogout={handleLogout}
            onSearchProjects={searchCreatorProjects}
            onReturnToWizard={
              verificationReturnCampaignId
                ? () => {
                    const campaignId = verificationReturnCampaignId;
                    setVerificationReturnCampaignId(null);
                    setWizardResumeStep(7);
                    navigate('creator-campaign-create', { campaignId });
                  }
                : undefined
            }
          />
        );
      case 'creator-campaign-create':
        return (
          <CampaignCreationWizardPage
            key={editingCampaignId ?? 'new-campaign'}
            campaignId={editingCampaignId}
            resumeStep={wizardResumeStep}
            onResumeStepConsumed={() => setWizardResumeStep(null)}
            onExit={() => {
              setVerificationReturnCampaignId(null);
              setWizardResumeStep(null);
              navigate('creator-projects');
            }}
            onNavigate={handleCreatorNavigate}
            onGoToVerification={(campaignId) => {
              setVerificationReturnCampaignId(campaignId);
              navigate('creator-verification');
            }}
            onLogout={handleLogout}
            onSearchProjects={searchCreatorProjects}
          />
        );
      case 'sponsor':
        return (
          <SponsorDashboardPage
            onLogout={handleLogout}
            onExplore={() => navigate('explore-projects')}
            onOpenCampaign={(campaignId) =>
              navigate('project-detail', { campaignId, backRoute: 'sponsor' })
            }
            onResumeCheckout={(campaignId, contributionId) =>
              navigate('contribution-checkout', { campaignId, contributionId })
            }
            onOpenTracking={(contributionId) =>
              navigate('contribution-tracking', { contributionId })
            }
          />
        );
      case 'profile':
        return <ProfilePage key="profile-datos" initialTab="datos" onNavigate={navigate} />;
      case 'organizations':
        return (
          <ProfilePage
            key="profile-organizaciones"
            initialTab="organizaciones"
            joinCode={currentJoinCode}
            onNavigate={navigate}
          />
        );
      case 'administration':
        return (
          <AdminKycVerificationPage
            key={adminInitialMenu ?? 'admin-default'}
            onLogout={handleLogout}
            initialMenu={adminInitialMenu}
          />
        );
      case 'forbidden':
        return <Forbidden403Page onNavigate={navigate} />;
      case 'not-found':
        return <NotFound404Page onNavigate={navigate} />;
      default:
        return <NotFound404Page onNavigate={navigate} />;
    }
  };

  const renderShell = () => {
    if (usesCreatorLayout) {
      return (
        <>
          {renderCurrentView()}
          <BottomNavBar
            activeRoute={activeRoute}
            onRouteChange={navigate}
            onOpenCreateMenu={() => setIsCreateChoiceOpen(true)}
            isAuthenticated={isAuthenticated}
          />
        </>
      );
    }

    if (isAdminRoute) {
      return (
        <main className="brotar-admin-fullscreen">{renderCurrentView()}</main>
      );
    }

    const isAuthRoute =
      activeRoute === 'login' ||
      activeRoute === 'register' ||
      activeRoute === 'recover-password' ||
      activeRoute === 'force-change-password';

    if (isAuthRoute) {
      return (
        <main className="brotar-auth-fullscreen">{renderCurrentView()}</main>
      );
    }

    return (
      <>
        <Navbar
          currentRoute={activeRoute}
          onRouteChange={navigate}
          onSearchSubmit={(query) => navigate('explore-catalog', { catalogQuery: query })}
          isAuthenticated={isAuthenticated}
          userName={user?.fullName}
          userRole={user?.role}
          userRoleLabel={
            user?.role === 'creator'
              ? 'Creador'
              : user?.role === 'sponsor'
                ? 'Patrocinador'
                : user?.role === 'admin'
                  ? 'Administración'
                  : undefined
          }
          onLogout={handleLogout}
        />
        <main className={`brotar-main-content ${isAuthRoute ? 'brotar-main-content--auth' : ''}`}>{renderCurrentView()}</main>
        {!isAuthRoute && <Footer onNavigate={navigate} />}
        {!isAuthRoute && (
          <BottomNavBar
            activeRoute={activeRoute}
            onRouteChange={navigate}
            onOpenCreateMenu={() => setIsCreateChoiceOpen(true)}
            isAuthenticated={isAuthenticated}
          />
        )}
      </>
    );
  };

  return (
    <div className="brotar-app-layout">
      {renderShell()}

      <CreateChoiceModal
        isOpen={isCreateChoiceOpen}
        onClose={() => setIsCreateChoiceOpen(false)}
        onSelectStory={handleSelectStoryCreation}
        onSelectCampaign={handleSelectCampaignCreation}
      />

      <CreateStoryModal
        isOpen={isGlobalCreateStoryOpen}
        onClose={() => setIsGlobalCreateStoryOpen(false)}
        onSuccess={() => {
          if (activeRoute === 'explore-feed') {
            navigate('explore-feed');
          }
        }}
        onNavigate={navigate}
      />
    </div>
  );
};

