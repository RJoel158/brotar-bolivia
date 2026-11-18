import './Footer.css';

export interface FooterLink {
  id: string;
  label: string;
}

export interface FooterProps {
  onNavigate?: (itemId: string) => void;
  className?: string;
}

const BROTAR_LINKS: FooterLink[] = [
  { id: 'explore-projects', label: 'Explorar' },
  { id: 'how-it-works', label: 'Cómo funciona' },
  { id: 'for-creators', label: 'Para creadores' },
];

const TRUST_LINKS: FooterLink[] = [
  { id: 'verification', label: 'Verificación' },
  { id: 'faq', label: 'Preguntas frecuentes' },
  { id: 'terms', label: 'Términos' },
];

export function Footer({ onNavigate, className = '' }: FooterProps) {
  const handleClick = (id: string) => {
    onNavigate?.(id);
  };

  return (
    <footer className={`brotar-footer-public ${className}`.trim()}>
      <div className="brotar-footer-public__inner">
        <div className="brotar-footer-public__brand">
          <p className="brotar-footer-public__name">Brotar</p>
          <p className="brotar-footer-public__tagline">
            Plataforma boliviana de crowdfunding para proyectos confiables.
          </p>
        </div>

        <div className="brotar-footer-public__columns">
          <div className="brotar-footer-public__col">
            <h3>Brotar</h3>
            <ul>
              {BROTAR_LINKS.map((link) => (
                <li key={link.id}>
                  <button type="button" onClick={() => handleClick(link.id)}>
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="brotar-footer-public__col">
            <h3>Confianza</h3>
            <ul>
              {TRUST_LINKS.map((link) => (
                <li key={link.id}>
                  <button type="button" onClick={() => handleClick(link.id)}>
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="brotar-footer-public__col">
            <h3>Contacto</h3>
            <ul>
              <li>
                <a href="mailto:contacto@brotar.bo">contacto@brotar.bo</a>
              </li>
              <li className="brotar-footer-public__social">
                <span>Redes sociales</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="brotar-footer-public__bottom">
        <p>© 2026 Brotar. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
