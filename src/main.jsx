import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

try {
  if (typeof localStorage !== 'undefined') {
    const keysToRemove = [
      'luckybet_commission_settings',
      'luckybet_custom_print_browser_settings',
      'luckybet_rbac_audit_logs',
      'luckybet_rbac_deleted_users',
      'luckybet_rbac_roles',
      'luckybet_rbac_user_perms',
      'luckybet_rbac_users',
      'luckybet_theme',
      'luckybet_token',
      'luckybet_user',
    ]
    keysToRemove.forEach((k) => localStorage.removeItem(k))
    localStorage.clear()
  }
} catch {}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
