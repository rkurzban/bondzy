import React from 'react'
import ReactDOM from 'react-dom/client'
import { initSentry } from './sentry'
import { ErrorBoundary } from './error-boundary'
import BondzyApp from './App.jsx'

initSentry()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BondzyApp />
    </ErrorBoundary>
  </React.StrictMode>
)
