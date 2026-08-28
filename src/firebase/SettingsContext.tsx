import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { DEFAULT_SETTINGS, getSettings, type SiteSettings } from './settings'

const SettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS)

// Carga el número de WhatsApp (y demás configuración del sitio) una sola vez al arrancar la app.
// Mientras carga, se usa el valor por defecto como respaldo, así los botones de WhatsApp de la
// landing nunca quedan rotos ni tienen que esperar a Firestore para mostrarse.
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => {
        // Si falla (sin conexión, reglas, etc.) seguimos con el valor por defecto.
      })
  }, [])

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
}

export function useSettings(): SiteSettings {
  return useContext(SettingsContext)
}
