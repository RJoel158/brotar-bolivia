import type { FC } from 'react';
import { FileCheck, Sprout, TrendingUp } from 'lucide-react';
import { Card } from '../../../shared/index.ts';

export const HowItWorksPage: FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Propuesta y Verificación Ecológica',
      description: 'Los creadores envían sus proyectos con metas claras de impacto ambiental. Nuestro comité valida la viabilidad y sostenibilidad.',
      icon: <FileCheck size={28} color="#059669" />,
    },
    {
      num: '02',
      title: 'Campaña de Crowdfunding Verde',
      description: 'La comunidad y empresas patrocinadoras aportan fondos mediante microdonaciones, recompensas o patrocinio corporativo.',
      icon: <Sprout size={28} color="#059669" />,
    },
    {
      num: '03',
      title: 'Ejecución y Monitoreo de Impacto',
      description: 'Los fondos se liberan por hitos verificados y se publican reportes abiertos de métricas ambientales.',
      icon: <TrendingUp size={28} color="#059669" />,
    },
  ];

  return (
    <div className="feature-page how-it-works-page">
      <div className="page-header">
        <h1 className="page-title">¿Cómo Funciona Brotar?</h1>
        <p className="page-subtitle">Transparencia, impacto medible y compromiso ambiental en cada paso.</p>
      </div>

      <div className="steps-grid">
        {steps.map((step) => (
          <Card key={step.num} padding="lg" className="step-card">
            <span className="step-num">{step.num}</span>
            <div className="step-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              {step.icon}
            </div>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-desc">{step.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
