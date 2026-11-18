/** Editorial content only. Campaign names, stories and goals come from the API. */
export const categoryLabels: Record<string, string> = {
  social: 'Social', ambiental: 'Ambiental', productivo: 'Productivo',
  educacion: 'Educación', salud: 'Salud', cultura: 'Cultura', otro: 'Otro',
};

export const audienceContent = {
  supporter: {
    heading: 'Elige dónde quieres sumar.',
    description: 'Explora sin registrarte. Cuando una iniciativa te interese, conoce a su equipo y revisa el plan.',
    steps: ['Conoce al equipo y el propósito de su campaña.', 'Revisa el presupuesto, el plazo y las condiciones.', 'Elige tu aporte y consulta los avances publicados.'],
    action: 'Encontrar un proyecto', route: 'explore-catalog', href: '/explorar/campanas',
    note: 'Puedes explorar los proyectos sin crear una cuenta.',
  },
  creator: {
    heading: 'Tu idea. Un plan para empezar.',
    description: '¿Qué quieres hacer y qué necesitas para lograrlo? Empieza por ahí. El resto se prepara paso a paso.',
    steps: ['Crea una cuenta de creador y verifica tu identidad.', 'Prepara la historia, el presupuesto y el plan de trabajo.', 'Envía tu campaña a revisión antes de publicarla.'],
    action: 'Preparar mi proyecto', route: 'for-creators', href: '/para-creadores',
    note: 'No necesitas tener la campaña terminada para conocer el proceso.',
  },
} as const;

export const journeySteps = ['Conoce la iniciativa', 'Prueba un aporte', 'Consulta sus avances'] as const;
export const frequentlyAsked = [
  { question: '¿Se cobra dinero real en esta versión?', answer: 'No. Los pagos de Brotar son simulados. Puedes conocer el flujo y probar un aporte sin que se realice un cobro real.' },
  { question: '¿Qué significa que una campaña sea revisada?', answer: 'La revisión de una campaña y la verificación de identidad son controles distintos. No garantizan que el proyecto cumpla sus objetivos. Consulta la información, las condiciones y las actualizaciones del equipo antes de decidir.' },
  { question: '¿Qué pasa si no se alcanza la meta?', answer: 'Depende del modelo de financiamiento de la campaña: flexible o todo o nada. Abre el proyecto y consulta sus condiciones antes de participar.' },
  { question: '¿Tengo que crear una cuenta para explorar?', answer: 'Puedes conocer los proyectos sin iniciar sesión. Para aportar o preparar una campaña necesitas una cuenta y completar los requisitos de verificación correspondientes.' },
] as const;
