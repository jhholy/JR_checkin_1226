import React, { Suspense } from 'react';
import ErrorBoundary from './utils/errors/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import AppRouter from './components/routing/AppRouter';

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <AppRouter />
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;