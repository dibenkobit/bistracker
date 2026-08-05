import type { CharacterClass, Faction, Mode, ModeId } from '@/game'
import { MODES } from '@/game'

import { Crest } from './Crest'

interface MastheadProps {
  cls: CharacterClass
  faction: Faction
  level: number
  mode: ModeId
  onModeChange: (mode: ModeId) => void
}

export function Masthead({ cls, faction, level, mode, onModeChange }: MastheadProps) {
  return (
    <header className="masthead">
      <Crest cls={cls} />
      <div>
        <h1>Оружейная</h1>
        <p className="masthead__sub">
          {level} уровень · <span style={{ color: cls.color }}>{cls.name}</span> ·{' '}
          <span style={{ color: faction.color }}>{faction.name}</span>
        </p>
      </div>

      {/* один и тот же список, два вопроса: что надеть сейчас и что покупать */}
      <div className="modes" role="group" aria-label="Что показывать">
        {MODES.map((item: Mode) => (
          <button
            key={item.id}
            className={`mode ${item.id === mode ? 'is-active' : ''}`}
            onClick={() => onModeChange(item.id)}
            title={item.hint}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  )
}
