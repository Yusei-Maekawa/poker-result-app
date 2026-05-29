import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { isMaintenanceMode } from './config/maintenance'

async function bootstrap() {
  const rootEl = document.getElementById('root')
  if (!rootEl) return

  const root = createRoot(rootEl)

  if (isMaintenanceMode()) {
    const { default: MaintenancePage } = await import('./pages/MaintenancePage')
    root.render(
      <StrictMode>
        <MaintenancePage />
      </StrictMode>,
    )
    return
  }

  const { default: App } = await import('./App')
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
