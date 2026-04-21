import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { EntityProvider } from './contexts/EntityContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EntityProvider>
      <App />
    </EntityProvider>
  </StrictMode>,
)
