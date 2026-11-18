import type { FC, KeyboardEvent, MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, FileText, Heart, Leaf, MapPin, MessageCircle, ShieldCheck, Sprout } from 'lucide-react';
import type { CampaignResponse } from '../../../shared/api/campaignsApi.ts';
import { useCampaignCatalog } from '../../../shared/hooks/useCampaignCatalog.ts';
import { audienceContent, categoryLabels, frequentlyAsked, journeySteps } from './homeContent.ts';
import { ProjectArtwork } from './ProjectArtwork.tsx';
import './HomePage.css';

export interface HomePageProps {
  onNavigate?: (route: string) => void;
  onSelectProject?: (projectId: string) => void;
}
type Audience = keyof typeof audienceContent;
const money = (amount: number, currency = 'BOB') => new Intl.NumberFormat('es-BO', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
const isClosed = (campaign: CampaignResponse, now: number) => Boolean(campaign.endDate && new Date(campaign.endDate).getTime() <= now);
const hasStory = (campaign: CampaignResponse) => (campaign.problem?.trim().length ?? 0) >= 40 && (campaign.solution?.trim().length ?? 0) >= 40;

export const HomePage: FC<HomePageProps> = ({ onNavigate, onSelectProject }) => {
  const catalog = useCampaignCatalog();
  const previewRef = useRef<HTMLDivElement>(null);
  const [audience, setAudience] = useState<Audience>('supporter');
  const [journeyStep, setJourneyStep] = useState(0);
  const [exampleAmount, setExampleAmount] = useState(50);
  const [now, setNow] = useState(() => Date.now());
  const [storyView, setStoryView] = useState<'problem' | 'solution'>('problem');
  // Prefer a complete, still-open story. Do not feature a random picture as evidence.
  const stories = catalog.items.filter(hasStory).sort((a, b) => Number(isClosed(a, now)) - Number(isClosed(b, now)));
  const featured = stories.find(campaign => !isClosed(campaign, now)) ?? stories[0] ?? null;
  const selectedProjects = stories.filter(campaign => campaign.id !== featured?.id).slice(0, 2);
  const audienceInfo = audienceContent[audience];
  const exampleFee = Math.round(exampleAmount * 5) / 100;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const navigate = (event: MouseEvent<HTMLAnchorElement>, route: string) => {
    if (!onNavigate || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onNavigate(route);
  };
  const openProject = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (!onSelectProject || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onSelectProject(id);
  };
  const moveToStep = (step: number) => {
    setJourneyStep(step);
    window.requestAnimationFrame(() => {
      previewRef.current?.focus({ preventScroll: true });
      if (window.matchMedia('(max-width: 768px)').matches) {
        previewRef.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    });
  };
  const handleAudienceKeys = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'supporter' : event.key === 'End' ? 'creator' : audience === 'supporter' ? 'creator' : 'supporter';
    setAudience(next);
    event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`#path-${next}`)?.focus();
  };

  return (
    <div className="brotar-welcome">
      <section className="welcome-hero" aria-labelledby="welcome-title">
        <div className="welcome-hero__copy">
          <h1 id="welcome-title"><span className="welcome-hero__statement">Tu comunidad tiene ideas.</span><span className="welcome-hero__response">Tú puedes impulsarlas.</span></h1>
          <p>Un refugio, una biblioteca, un espacio para crear. Conoce los proyectos de Brotar y encuentra tu forma de participar.</p>
          <div className="welcome-actions">
            <a className="welcome-button" href="#tu-camino" onClick={() => setAudience('supporter')}>Quiero apoyar <Heart size={17} aria-hidden="true" /></a>
            <a className="welcome-button welcome-button--outline" href="#tu-camino" onClick={() => setAudience('creator')}>Tengo un proyecto <Sprout size={18} aria-hidden="true" /></a>
          </div>
          <a className="welcome-hero__learn" href="#como-apoyar">Primero, descubre cómo funciona <ChevronDown size={15} aria-hidden="true" /></a>
        </div>
        <div className="welcome-cover">
          <ProjectArtwork category={featured?.category} birds={true} />
          <div className="welcome-cover__story">
            {catalog.isLoading ? <p role="status">Buscando una historia para compartir…</p> : catalog.error ? <div role="alert"><p>No pudimos cargar la iniciativa.</p><button type="button" className="welcome-link" onClick={catalog.refresh}>Volver a intentar</button></div> : featured ? <>
              <div className="welcome-cover__context"><span>{categoryLabels[featured.category] ?? featured.category}</span><span>{isClosed(featured, now) ? 'Campaña cerrada' : 'Proyecto publicado'}</span></div>
              <h2><a href={`/proyectos/${featured.id}`} onClick={event => openProject(event, featured.id)}>{featured.title}</a></h2>
              <p>{featured.shortSummary || featured.problem}</p>
              <a className="welcome-link" href="#su-historia">Conoce su historia <ArrowUpRight size={17} aria-hidden="true" /></a>
            </> : <><h2>La próxima historia puede ser la tuya.</h2><p>Conoce los pasos para preparar una campaña en Brotar.</p><a className="welcome-link" href="/para-creadores" onClick={event => navigate(event, 'for-creators')}>Cómo crear un proyecto</a></>}
          </div>
        </div>
      </section>

      {featured ? <section className="welcome-story" id="su-historia" aria-labelledby="story-title">
        <div className="welcome-story__intro"><span className="welcome-caption"><Leaf size={16} aria-hidden="true" /> Una iniciativa, de cerca</span><h2 id="story-title">¿Qué quieren cambiar?</h2>{featured.location ? <p className="welcome-location"><MapPin size={15} aria-hidden="true" />{featured.location}</p> : null}<p className="welcome-story__source">La historia, según la información publicada por su equipo.</p></div>
        <div className="welcome-story__detail">
          <div className="welcome-story__switch" role="group" aria-label="Conocer el contexto del proyecto"><button type="button" aria-pressed={storyView === 'problem'} onClick={() => setStoryView('problem')}>La necesidad</button><button type="button" aria-pressed={storyView === 'solution'} onClick={() => setStoryView('solution')}>La propuesta</button></div>
          <p className="welcome-story__quote" aria-live="polite"><span className="welcome-text-change" key={storyView}>{storyView === 'problem' ? featured.problem : featured.solution}</span></p>
          <div className="welcome-story__bottom"><div><span>Meta de la campaña</span><strong>{money(featured.goalAmount, featured.currency)}</strong></div><a className="welcome-link" href={`/proyectos/${featured.id}`} onClick={event => openProject(event, featured.id)}>Ver plan y detalles <ArrowUpRight size={17} aria-hidden="true" /></a></div>
        </div>
      </section> : null}

      <section className="welcome-path" id="tu-camino" aria-labelledby="path-title">
        <div className="welcome-section-intro"><h2 id="path-title">¿Dónde entras tú?</h2><p>Apoyar una iniciativa o preparar la tuya. Elige por dónde empezar.</p></div>
        <div className="welcome-path__tabs" role="tablist" aria-label="Cómo quieres participar">{(['supporter', 'creator'] as const).map(value => <button key={value} id={`path-${value}`} type="button" role="tab" aria-selected={audience === value} aria-controls="path-panel" tabIndex={audience === value ? 0 : -1} onClick={() => setAudience(value)} onKeyDown={handleAudienceKeys}>{value === 'supporter' ? <Heart size={20} aria-hidden="true" /> : <Sprout size={22} aria-hidden="true" />}{value === 'supporter' ? 'Quiero apoyar' : 'Tengo un proyecto'}</button>)}</div>
        <div key={audience} id="path-panel" role="tabpanel" aria-labelledby={`path-${audience}`} tabIndex={0} className={`welcome-path__panel welcome-path__panel--${audience}`}>
          <div><h3>{audienceInfo.heading}</h3><p>{audienceInfo.description}</p></div>
          <div><ol>{audienceInfo.steps.map((step, index) => <li key={step}><span aria-hidden="true">{index + 1}</span>{step}</li>)}</ol><a className="welcome-button" href={audienceInfo.href} onClick={event => navigate(event, audienceInfo.route)}>{audienceInfo.action}<ArrowUpRight size={17} aria-hidden="true" /></a><p className="welcome-path__note">{audienceInfo.note}</p></div>
        </div>
      </section>

      <section className="welcome-journey" id="como-apoyar" aria-labelledby="journey-title">
        <div className="welcome-journey__instructions"><h2 id="journey-title">Pruébalo antes de decidir.</h2><p>Explora cómo se apoya una iniciativa. Aquí no se crea un aporte ni se realiza ningún cobro.</p><ol className="welcome-journey__steps">{journeySteps.map((label, index) => <li key={label}><button type="button" aria-current={journeyStep === index ? 'step' : undefined} aria-controls="journey-preview" onClick={() => moveToStep(index)}><span>{index < journeyStep ? <Check size={16} aria-hidden="true" /> : index + 1}</span><span>{label}</span><ChevronRight size={17} aria-hidden="true" /></button></li>)}</ol></div>
        <div className="welcome-preview" id="journey-preview" ref={previewRef} role="region" tabIndex={-1} aria-label={`Paso ${journeyStep + 1}: ${journeySteps[journeyStep]}`}>
          <div className="welcome-preview__label"><span>Recorrido de ejemplo</span><span>{journeyStep + 1} de 3</span></div>
          {journeyStep === 0 ? <div key={journeyStep} className="welcome-preview__content"><FileText size={30} aria-hidden="true" /><h3>Primero, entiende la idea.</h3><p>{featured?.shortSummary || 'Abre una campaña y conoce qué quiere hacer su equipo.'}</p><ul><li><CheckCheck size={17} aria-hidden="true" />Quién impulsa el proyecto</li><li><CheckCheck size={17} aria-hidden="true" />Cómo se usará el presupuesto</li><li><CheckCheck size={17} aria-hidden="true" />Plazo y modelo de financiamiento</li></ul><p className="welcome-preview__footnote">No te quedes solo con la portada. Lee el plan completo.</p></div> : journeyStep === 1 ? <div key={journeyStep} className="welcome-preview__content"><h3>Un aporte, con las cuentas claras.</h3><label className="welcome-amount-label" htmlFor="example-amount">Aporte de ejemplo <output htmlFor="example-amount">{money(exampleAmount)}</output></label><input id="example-amount" type="range" min="10" max="500" step="10" value={exampleAmount} onChange={event => setExampleAmount(Number(event.target.value))} /><div className="welcome-presets" role="group" aria-label="Montos de ejemplo">{[50, 100, 200].map(amount => <button key={amount} type="button" aria-pressed={exampleAmount === amount} onClick={() => setExampleAmount(amount)}>{money(amount)}</button>)}</div><dl className="welcome-breakdown"><div><dt>Comisión Brotar (5%)</dt><dd>{money(exampleFee)}</dd></div><div><dt>Para el proyecto</dt><dd>{money(exampleAmount - exampleFee)}</dd></div></dl><p className="welcome-preview__footnote">Cálculo ilustrativo en bolivianos. En esta versión los pagos son simulados.</p></div> : <div key={journeyStep} className="welcome-preview__content"><MessageCircle size={30} aria-hidden="true" /><h3>La historia continúa.</h3><p>Consulta las actualizaciones que publique el equipo y vuelve a revisar el plan de trabajo.</p><ul><li><CheckCheck size={17} aria-hidden="true" />Publicaciones y avances del proyecto</li><li><CheckCheck size={17} aria-hidden="true" />Estado de tu aporte en tu cuenta</li><li><CheckCheck size={17} aria-hidden="true" />Condiciones de las recompensas, si existen</li></ul><p className="welcome-preview__footnote">La frecuencia y el contenido de los avances dependen de cada equipo.</p></div>}
          <div className="welcome-preview__controls"><button type="button" disabled={journeyStep === 0} onClick={() => moveToStep(Math.max(0, journeyStep - 1))} aria-label="Paso anterior"><ChevronLeft size={17} aria-hidden="true" />Anterior</button>{journeyStep < 2 ? <button type="button" onClick={() => moveToStep(Math.min(2, journeyStep + 1))}>Siguiente<ChevronRight size={17} aria-hidden="true" /></button> : <a href="/explorar/campanas" onClick={event => navigate(event, 'explore-catalog')}>Explorar proyectos<ArrowUpRight size={17} aria-hidden="true" /></a>}</div>
        </div>
      </section>

      <section className="welcome-trust" aria-labelledby="trust-title"><div className="welcome-section-intro"><h2 id="trust-title">Qué revisamos. Qué decides tú.</h2><p>Antes de decidir, conoce qué revisa la plataforma y qué debes revisar tú.</p></div><div className="welcome-trust__columns"><div><ShieldCheck size={26} aria-hidden="true" /><h3>Lo que revisa Brotar</h3><p>La identidad del creador y la información de la campaña forman parte del proceso de revisión.</p><a className="welcome-link" href="/verificacion" onClick={event => navigate(event, 'verification')}>Conocer el proceso<ArrowUpRight size={16} aria-hidden="true" /></a></div><div><FileText size={26} aria-hidden="true" /><h3>Lo que eliges tú</h3><p>Revisa objetivos, presupuesto, plazo y condiciones. Una revisión no garantiza los resultados del proyecto.</p><a className="welcome-link" href="/preguntas-frecuentes" onClick={event => navigate(event, 'faq')}>Resolver mis dudas<ArrowUpRight size={16} aria-hidden="true" /></a></div></div></section>

      {selectedProjects.length ? <section className="welcome-selection" aria-labelledby="selection-title"><div className="welcome-selection__heading"><h2 id="selection-title">Más historias de Brotar.</h2><a className="welcome-link" href="/explorar/campanas" onClick={event => navigate(event, 'explore-catalog')}>Ver todos los proyectos<ArrowUpRight size={17} aria-hidden="true" /></a></div><div className="welcome-selection__list">{selectedProjects.map(campaign => <article className="welcome-small-story" key={campaign.id}><a className="welcome-small-story__art" href={`/proyectos/${campaign.id}`} onClick={event => openProject(event, campaign.id)} aria-label={`Conocer ${campaign.title}`}><ProjectArtwork category={campaign.category} /></a><div><span className="welcome-caption">{categoryLabels[campaign.category] ?? campaign.category}{isClosed(campaign, now) ? ' / Campaña cerrada' : ''}</span><h3><a href={`/proyectos/${campaign.id}`} onClick={event => openProject(event, campaign.id)}>{campaign.title}</a></h3><p>{campaign.problem || campaign.shortSummary}</p><a className="welcome-link" href={`/proyectos/${campaign.id}`} onClick={event => openProject(event, campaign.id)}>Conocer la propuesta<ArrowUpRight size={16} aria-hidden="true" /></a></div></article>)}</div></section> : null}

      <section className="welcome-faq" aria-labelledby="faq-title"><h2 id="faq-title">¿Todavía tienes dudas?</h2><div>{frequentlyAsked.map(item => <details key={item.question}><summary>{item.question}<ChevronDown size={18} aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div></section>
      <section className="welcome-closing"><Sprout size={32} aria-hidden="true" /><h2>Elige una idea.<br />O comparte la tuya.</h2><div className="welcome-actions"><a className="welcome-button" href="/explorar/campanas" onClick={event => navigate(event, 'explore-catalog')}>Encontrar un proyecto</a><a className="welcome-button welcome-button--outline" href="/para-creadores" onClick={event => navigate(event, 'for-creators')}>Empezar el mío</a></div><p>Brotar está en demostración. Los pagos son simulados, sin cobros reales.</p></section>
    </div>
  );
};
