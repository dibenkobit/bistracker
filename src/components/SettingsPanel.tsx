import type { ClassId, FactionId } from '@/data/schema'
import { CLASSES, FACTIONS, iconUrl } from '@/game'
import { cssVars } from '@/lib/css'

interface SettingsPanelProps {
  faction: FactionId
  cls: ClassId
  onFactionChange: (faction: FactionId) => void
  onClassChange: (cls: ClassId) => void
}

/** Панель как в создании персонажа - сюда постепенно переезжают все настройки. */
export function SettingsPanel({
  faction,
  cls,
  onFactionChange,
  onClassChange,
}: SettingsPanelProps) {
  return (
    <aside className="panel">
      <section className="panel__group">
        <h3 className="panel__title">Фракция</h3>
        <div className="panel__row">
          {FACTIONS.map((item) => (
            <button
              key={item.id}
              className={`pick ${item.id === faction ? 'is-active' : ''}`}
              style={cssVars({ '--pick-color': item.color })}
              onClick={() => onFactionChange(item.id)}
              title={`Список для стороны: ${item.name}`}
            >
              <img src={item.crest} alt={item.name} />
              <span className="pick__label">{item.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel__group">
        <h3 className="panel__title">Класс</h3>
        <div className="panel__row panel__row--grid">
          {CLASSES.map((item) => (
            <button
              key={item.id}
              className={`pick ${item.id === cls ? 'is-active' : ''}`}
              style={cssVars({ '--pick-color': item.color })}
              onClick={() => onClassChange(item.id)}
              title={item.name}
            >
              <img src={iconUrl(item.icon)} alt={item.name} />
              <span className="pick__label">{item.name}</span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  )
}
