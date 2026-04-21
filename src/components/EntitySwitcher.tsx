import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useEntity, type OperatingEntity } from '../contexts/EntityContext'
import { supabase } from '../lib/supabase'

interface EntitySwitcherProps {
  currentRole: string | null
}

const ENTITY_META: Record<OperatingEntity, { label: string; dot: string; pill: string }> = {
  ERHA_FC: {
    label: 'ERHA F&C',
    dot: 'bg-blue-500',
    pill: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
  },
  ERHA_SS: {
    label: 'ERHA S&S',
    dot: 'bg-amber-500',
    pill: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100',
  },
}

export function EntitySwitcher({ currentRole }: EntitySwitcherProps) {
  const { activeEntity, setActiveEntity } = useEntity()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  const handleSelect = async (next: OperatingEntity) => {
    setOpen(false)
    if (next === activeEntity) return

    const confirmed = window.confirm(
      `Switch to ${ENTITY_META[next].label}? The page will reload.`
    )
    if (!confirmed) return

    // Supabase doesn't throw on insert failures — inspect { error } directly.
    // A raw try/catch here would silently swallow schema mismatches and row-level
    // security rejections, which is how we missed the action_type/event_type bug.
    const { error: logErr } = await supabase.from('activity_log').insert({
      action_type: 'entity_switched',
      entity_type: 'system',
      entity_id: null,
      operating_entity: next,
      metadata: {
        from: activeEntity,
        to: next,
        user_role: currentRole,
      },
    })
    if (logErr) console.error('activity_log insert failed:', logErr)

    setActiveEntity(next)
    window.location.reload()
  }

  const active = ENTITY_META[activeEntity]

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors ${active.pill}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={`w-2 h-2 rounded-full ${active.dot}`} />
        <span>{active.label}</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-40 py-1"
        >
          {(Object.keys(ENTITY_META) as OperatingEntity[]).map((key) => {
            const meta = ENTITY_META[key]
            const isActive = key === activeEntity
            return (
              <button
                key={key}
                type="button"
                role="menuitem"
                onClick={() => handleSelect(key)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                  isActive ? 'font-semibold' : 'font-normal'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                <span className="flex-1 text-gray-800">{meta.label}</span>
                {isActive && (
                  <span className="text-xs text-gray-400">active</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
