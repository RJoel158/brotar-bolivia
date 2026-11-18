import type { FC } from 'react';
import { Sprout, Handshake, BarChart3 } from 'lucide-react';
import { Card, Button } from '../../../shared/index.ts';

export interface ForCreatorsPageProps {
  onStartCampaign?: () => void;
}

export const ForCreatorsPage: FC<ForCreatorsPageProps> = ({ onStartCampaign }) => {
  return (
    <div className="feature-page for-creators-page">
      <div className="page-header">
        <h1 className="page-title">Para Creadores e Innovadores Verdes</h1>
        <p className="page-subtitle">Convierte tu idea de sostenibilidad en una realidad con respaldo colectivo.</p>
      </div>

      <div className="creators-content">
        <div className="creators-grid">
          <Card padding="lg">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sprout size={20} color="#059669" />
              <span>Asesoría Especializada</span>
            </h3>
            <p>Te guiamos en la formulación técnica y financiera de tu propuesta ambiental.</p>
          </Card>
          <Card padding="lg">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Handshake size={20} color="#059669" />
              <span>Acceso a Red de Patrocinadores</span>
            </h3>
            <p>Conecta con empresas de impacto B-Corp e inversores con criterios ESG.</p>
          </Card>
          <Card padding="lg">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} color="#059669" />
              <span>Dashboard de Gestión</span>
            </h3>
            <p>Herramientas para monitorear aportes, comunicarte con tus patrocinadores y gestionar hitos.</p>
          </Card>
        </div>

        <div className="creators-cta">
          <Button size="lg" onClick={onStartCampaign}>
            Postular mi Proyecto
          </Button>
        </div>
      </div>
    </div>
  );
};
