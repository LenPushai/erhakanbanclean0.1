import { createContext, useContext, useState, type ReactNode } from 'react'

export type OperatingEntity = 'ERHA_FC' | 'ERHA_SS'

const STORAGE_KEY = 'erha_active_entity'
const VALID_ENTITIES: readonly OperatingEntity[] = ['ERHA_FC', 'ERHA_SS'] as const
const DEFAULT_ENTITY: OperatingEntity = 'ERHA_FC'

interface EntityContextValue {
  activeEntity: OperatingEntity
  setActiveEntity: (entity: OperatingEntity) => void
}

const EntityContext = createContext<EntityContextValue | null>(null)

// Hydrate synchronously during the provider's first render so downstream
// components (and Step 4's entity-scoped queries) never observe a default
// value before the real one arrives.
function readStoredEntity(): OperatingEntity {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && (VALID_ENTITIES as readonly string[]).includes(raw)) {
      return raw as OperatingEntity
    }
  } catch {
    // localStorage unavailable (private mode, disabled storage) — fall through
  }
  return DEFAULT_ENTITY
}

export function EntityProvider({ children }: { children: ReactNode }) {
  const [activeEntity, setActiveEntityState] = useState<OperatingEntity>(readStoredEntity)

  const setActiveEntity = (entity: OperatingEntity) => {
    setActiveEntityState(entity)
    try {
      localStorage.setItem(STORAGE_KEY, entity)
    } catch {
      // state still updates in memory even if persistence fails
    }
  }

  return (
    <EntityContext.Provider value={{ activeEntity, setActiveEntity }}>
      {children}
    </EntityContext.Provider>
  )
}

export function useEntity(): EntityContextValue {
  const ctx = useContext(EntityContext)
  if (!ctx) {
    throw new Error('useEntity must be used within an EntityProvider')
  }
  return ctx
}
