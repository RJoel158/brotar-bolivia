import type { LucideIcon } from 'lucide-react';
import { Coins, Globe2, Sprout, Target, TrendingUp, Users2 } from 'lucide-react';

/**
 * Contenido estático del landing (copy del Figma "01.Landing Principal").
 * Los proyectos y el destacado NO viven aquí: se leen de la API de campañas.
 */

export interface ImpactStat {
  id: 'projects' | 'raised' | 'progress';
  icon: LucideIcon;
  label: string;
}

export interface PurposeCard {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export const heroContent = {
  badge: 'Impacto sostenible verificado',
  title: 'Impulsa el cambio sostenible en Bolivia',
  description:
    'Conectamos personas comprometidas con proyectos de impacto social, ambiental y productivo. Transparencia total y resultados medibles en cada aporte.',
  primaryAction: 'Explorar proyectos',
  secondaryAction: 'Cómo funciona',
} as const;

/**
 * Indicadores de la banda de impacto. Todos se calculan con las campañas
 * publicadas que devuelve la API (QA #2: antes había cifras ambientales
 * inventadas que no coincidían con el resto de la plataforma).
 */
export const impactStats: ImpactStat[] = [
  { id: 'projects', icon: Sprout, label: 'Proyectos publicados' },
  { id: 'raised', icon: Coins, label: 'Recaudado por la comunidad' },
  { id: 'progress', icon: Target, label: 'Avance promedio de las metas' },
];

export const purposeContent = {
  eyebrow: 'Qué es Brotar',
  title: 'Financiamiento colectivo con impacto real',
  description:
    'Brotar es una plataforma donde puedes financiar y crear proyectos que generan impacto real en comunidades bolivianas. Desde reforestación hasta energía limpia, cada aporte cuenta para transformar el futuro de nuestro país.',
} as const;

export const purposeCards: PurposeCard[] = [
  {
    id: 'social',
    icon: Users2,
    title: 'Impacto Social',
    description:
      'Apoyamos iniciativas orientadas a la educación comunitaria, acceso a servicios básicos y desarrollo inclusivo en áreas rurales y periurbanas.',
  },
  {
    id: 'ambiental',
    icon: Globe2,
    title: 'Impacto Ambiental',
    description:
      'Impulsamos la conservación de la biodiversidad, reforestación activa de bosques nativos y proyectos enfocados en mitigar el cambio climático.',
  },
  {
    id: 'productivo',
    icon: TrendingUp,
    title: 'Impacto Productivo',
    description:
      'Fomentamos emprendimientos sostenibles, agricultura ecológica y soberanía alimentaria que potencien las economías locales.',
  },
];

/** Etiquetas de las categorías reales del backend (enum campaign_category). */
export const categoryLabels: Record<string, string> = {
  social: 'Social',
  ambiental: 'Ambiental',
  productivo: 'Productivo',
  educacion: 'Educación',
  salud: 'Salud',
  cultura: 'Cultura',
  otro: 'Otro',
};

export const PROJECTS_PAGE_SIZE = 3;
