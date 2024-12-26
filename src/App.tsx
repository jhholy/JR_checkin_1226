import React from 'react';
import ErrorBoundary from './utils/errors/ErrorBoundary';
import AppRouter from './components/routing/AppRouter';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
};

export default App;