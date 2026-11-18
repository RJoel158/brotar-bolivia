import type { FC } from 'react';
import { useEffect } from 'react';
import { BadgeCheck, FileText, HelpCircle } from 'lucide-react';
import './TrustInfoPage.css';

export type TrustSection = 'verification' | 'faq' | 'terms';

export interface TrustInfoPageProps {
  /** Seccion a la que se desplaza al abrir la pagina (enlaces del footer). */
  section?: TrustSection;
  onNavigate?: (route: string) => void;
}

const FAQ_ITEMS = [
  {
    question: '¿Cómo apoyo un proyecto?',
    answer:
      'Crea una cuenta de patrocinador, abre el proyecto que te interese y pulsa "Apoyar". Eliges si haces una donación o tomas una recompensa, defines el monto y pagas en el mismo flujo.',
  },
  {
    question: '¿Qué medios de pago acepta Brotar?',
    answer:
      'Tarjeta, QR y transferencia. Al confirmar el pago recibes un comprobante con el código de la operación y el aporte aparece en "Mis aportes".',
  },
  {
    question: '¿Cuánto cobra Brotar?',
    answer:
      'Una comisión del 5% sobre cada aporte confirmado. Antes de pagar ves cuánto es la comisión y cuánto llega al proyecto.',
  },
  {
    question: '¿Qué pasa si una recompensa se agota?',
    answer:
      'El cupo se adjudica al confirmar el pago. Si la recompensa se agota antes, el aporte no se confirma y puedes elegir otra recompensa o hacer una donación.',
  },
  {
    question: '¿Puedo cancelar un aporte?',
    answer:
      'Sí, mientras siga pendiente de pago. Desde "Mis aportes" puedes cancelarlo o retomarlo; un aporte ya pagado no se puede cancelar desde la plataforma.',
  },
  {
    question: '¿Cómo publico mi proyecto?',
    answer:
      'Regístrate como creador, completa la verificación de identidad o de tu organización y usa el asistente de creación de campañas. El equipo de Brotar revisa la campaña antes de publicarla.',
  },
];

const VERIFICATION_ITEMS = [
  {
    title: 'Identidad de las personas (KYC)',
    text: 'Creadores y patrocinadores verifican su identidad con su cédula de identidad (anverso y reverso) y sus datos de contacto.',
  },
  {
    title: 'Organizaciones (KYB)',
    text: 'Las organizaciones registran su NIT y sus datos legales. Un administrador los revisa antes de habilitarlas para crear campañas.',
  },
  {
    title: 'Revisión de campañas',
    text: 'Cada campaña pasa por una revisión del equipo de Brotar antes de publicarse: objetivo, presupuesto, plan de trabajo y recompensas.',
  },
  {
    title: 'Seguimiento de los fondos',
    text: 'Los creadores publican avances del proyecto y los desembolsos se revisan desde el módulo de finanzas de la plataforma.',
  },
];

const TERMS_ITEMS = [
  'Brotar es una plataforma que conecta a creadores de proyectos con patrocinadores. Brotar no es el ejecutor de los proyectos publicados.',
  'Cada creador es responsable de la veracidad de la información de su campaña y de cumplir con las recompensas que ofrece.',
  'Por cada aporte confirmado, Brotar retiene una comisión del 5%; el resto se destina al proyecto según las reglas de desembolso de la plataforma.',
  'Para crear campañas o aportar es obligatorio completar la verificación de identidad. Brotar puede rechazar o suspender cuentas y campañas que incumplan estas condiciones.',
  'Los datos personales se usan solo para operar la plataforma (verificación, pagos y notificaciones) y no se comparten con terceros fuera de esos fines.',
];

export const TrustInfoPage: FC<TrustInfoPageProps> = ({ section = 'verification', onNavigate }) => {
  useEffect(() => {
    const target = document.getElementById(`brotar-trust-${section}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [section]);

  return (
    <div className="brotar-trust">
      <header className="brotar-trust__header">
        <h1 className="brotar-trust__title">Confianza en Brotar</h1>
        <p className="brotar-trust__subtitle">
          Cómo verificamos a las personas y los proyectos, respuestas a las dudas frecuentes y las
          condiciones de uso de la plataforma.
        </p>
        <nav className="brotar-trust__tabs" aria-label="Secciones">
          <button type="button" className={section === 'verification' ? 'is-active' : ''} onClick={() => onNavigate?.('verification')}>
            Verificación
          </button>
          <button type="button" className={section === 'faq' ? 'is-active' : ''} onClick={() => onNavigate?.('faq')}>
            Preguntas frecuentes
          </button>
          <button type="button" className={section === 'terms' ? 'is-active' : ''} onClick={() => onNavigate?.('terms')}>
            Términos
          </button>
        </nav>
      </header>

      <section id="brotar-trust-verification" className="brotar-trust__section">
        <h2>
          <BadgeCheck size={20} aria-hidden="true" /> Verificación
        </h2>
        <div className="brotar-trust__grid">
          {VERIFICATION_ITEMS.map((item) => (
            <article key={item.title} className="brotar-trust__card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="brotar-trust-faq" className="brotar-trust__section">
        <h2>
          <HelpCircle size={20} aria-hidden="true" /> Preguntas frecuentes
        </h2>
        <div className="brotar-trust__faq">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="brotar-trust__faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="brotar-trust-terms" className="brotar-trust__section">
        <h2>
          <FileText size={20} aria-hidden="true" /> Términos de uso
        </h2>
        <ol className="brotar-trust__terms">
          {TERMS_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
    </div>
  );
};
