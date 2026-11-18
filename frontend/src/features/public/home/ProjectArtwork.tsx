import { useEffect, useRef, useState } from 'react';
import { BookOpen, Building2, Heart, RotateCcw, Sprout } from 'lucide-react';

/** Illustration, never presented as a photograph or proof of project results. */
export function ProjectArtwork({ category = 'ambiental', birds = false }: { category?: string; birds?: boolean }) {
  const [animationKey, setAnimationKey] = useState(0);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const artworkRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!birds || !artworkRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHasEnteredView(true);
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(artworkRef.current);
    return () => observer.disconnect();
  }, [birds]);
  return (
    <div ref={artworkRef} className={`welcome-art welcome-art--${category}${hasEnteredView ? ' is-in-view' : ''}`}>
      {birds ? (
        <svg key={animationKey} viewBox="0 0 440 380" fill="none" aria-hidden="true">
          <path d="M80 370V175a140 140 0 0 1 280 0v195" fill="#C9DCC4" />
          <circle cx="303" cy="95" r="37" fill="#EAF1DC" />
          <path d="M44 327c118-42 228-8 350-52" stroke="#6B8260" strokeWidth="9" strokeLinecap="round" />
          <g className="welcome-art__bird">
          <path d="M149 270l-28 86 70-54" fill="#225E47" />
          <path d="M193 126c37-36 85-24 101 9 19 39-18 63-22 93-4 40-5 66-36 79-40 17-80-3-88-38-12-53 13-101 45-143Z" fill="#236747" />
          <path className="welcome-art__wing" d="M204 172c-31 23-44 68-26 97 13 20 39 16 54-1 21-24 21-62 5-89-8-14-20-15-33-7Z" fill="#6A9D67" />
          <path d="M281 139c35-2 41 15 14 34l-10-17" fill="#D5AF66" />
          <g className="welcome-art__eye"><circle cx="269" cy="137" r="5" fill="#F2F5DF" /><circle cx="270" cy="137" r="2.5" fill="#183D2D" /></g>
          <path d="m224 299-6 12m23-15-2 11" stroke="#D5AF66" strokeWidth="5" strokeLinecap="round" />
          </g>
          <path className="welcome-art__leaves-left" d="M76 325c-2-58-17-107-44-145m43 111c-39 0-55-25-50-48 30-1 51 14 50 48m-8-39c26-17 30-42 17-59-24 11-29 34-17 59" fill="#8AA77D" />
          <path className="welcome-art__leaves-right" d="M365 292c15-33 19-74 16-112m-6 49c-29-9-37-30-28-48 24 3 35 23 28 48m5-28c23-7 30-25 23-41-22 3-31 20-23 41" fill="#A6BE92" />
        </svg>
      ) : (
        <div className="welcome-art__symbol" aria-hidden="true">
          {category === 'educacion' ? <BookOpen /> : category === 'cultura' ? <Building2 /> : category === 'salud' || category === 'social' ? <Heart /> : <Sprout />}
          <span className="welcome-art__orbit" />
        </div>
      )}
      {birds ? <button className="welcome-art__replay" type="button" aria-label="Repetir movimiento de la ilustración" title="Repetir movimiento" onClick={() => setAnimationKey(value => value + 1)}><RotateCcw size={15} aria-hidden="true" /></button> : null}
      <span className="welcome-art__caption">Ilustración</span>
    </div>
  );
}
