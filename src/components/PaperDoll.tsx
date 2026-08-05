import type { ClassId, FactionId } from '@/data/schema'
import type { CharacterClass } from '@/game'
import { COSMETIC, isCosmetic, LEFT_COLUMN, RIGHT_COLUMN, WEAPON_ROW } from '@/game'
import { totalStats } from '@/lib/bis'

import { EmptySlot } from './EmptySlot'
import type { GearView } from './gear'
import { GearRow } from './GearRow'
import { SettingsPanel } from './SettingsPanel'
import { SummaryPanel } from './SummaryPanel'

interface PaperDollProps {
  view: GearView
  active: CharacterClass
  faction: FactionId
  cls: ClassId
  onFactionChange: (faction: FactionId) => void
  onClassChange: (cls: ClassId) => void
}

/** Экран персонажа: настройки, две колонки слотов и сводка по статам между ними. */
export function PaperDoll({
  view,
  active,
  faction,
  cls,
  onFactionChange,
  onClassChange,
}: PaperDollProps) {
  return (
    <main className="doll">
      <SettingsPanel
        faction={faction}
        cls={cls}
        onFactionChange={onFactionChange}
        onClassChange={onClassChange}
      />

      <div className="doll__col">
        {LEFT_COLUMN.map((slot) =>
          isCosmetic(slot) ? (
            <EmptySlot
              key={slot}
              name={COSMETIC[slot].name}
              icon={COSMETIC[slot].icon}
              side="left"
            />
          ) : (
            <GearRow key={slot} slot={slot} side="left" view={view} />
          ),
        )}
      </div>

      <SummaryPanel cls={active} totals={totalStats(view.bySlot)} />

      <div className="doll__col doll__col--right">
        {RIGHT_COLUMN.map((slot) => (
          <GearRow key={slot} slot={slot} side="right" view={view} />
        ))}
      </div>

      {/* оружие лежит в той же сетке, чтобы вставать по центру колонок со
          шмотом, а не всей страницы - слева от них ещё панель настроек */}
      <section className="doll__weapons">
        {WEAPON_ROW.filter((slot) => view.bySlot[slot]?.length).map((slot) => (
          <GearRow key={slot} slot={slot} side="left" view={view} />
        ))}
      </section>
    </main>
  )
}
