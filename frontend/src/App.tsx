import type { FC } from 'react';
import { AppProviders, AppRouter } from './app/index.ts';

export const App: FC = () => {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
};

export default App;
