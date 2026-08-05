import { useCallback, useMemo, useState } from 'react'

import type { GearView } from '@/components/gear'
import { GearRow } from '@/components/GearRow'
import { LevelDiff } from '@/components/LevelDiff'
import { LevelSlider } from '@/components/LevelSlider'
import { Masthead } from '@/components/Masthead'
import { PaperDoll } from '@/components/PaperDoll'
import { StaminaSlider } from '@/components/StaminaSlider'
import type { BisData, SlotId } from '@/data/schema'
import { findClass, findFaction, MIN_LEVEL, WEAPON_ROW } from '@/game'
import { useUrlState, type ViewState } from '@/hooks/useUrlState'
import { expandLevels } from '@/lib/bis'
import { cssVars } from '@/lib/css'
import { changedSlots, holdsUntil, longLivedBySlot } from '@/lib/diff'

import './App.css'

export default function App({ data }: { data: BisData }) {
  const [state, update] = useUrlState()
  const { faction, cls, level, stam, mode } = state

  // слот с раскрытым списком замен; открыт всегда не больше одного
  const [open, setOpen] = useState<SlotId | null>(null)

  // после смены класса, фракции или режима раскрытый список говорил бы уже
  // про другую вещь - закрываем
  const reset = useCallback(
    (patch: Partial<ViewState>) => {
      update(patch)
      setOpen(null)
    },
    [update],
  )

  const levels = useMemo(
    () => expandLevels(data, faction, cls, stam),
    [data, faction, cls, stam],
  )

  // тот же список, но отсортированный не по силе на уровне, а по тому,
  // сколько вещь ещё продержится
  const long = useMemo(
    () => (mode === 'long' ? longLivedBySlot(levels, level) : null),
    [levels, level, mode],
  )

  const bySlot = (mode === 'long' ? long : levels[level]) ?? {}

  // на минимальном уровне сравнивать не с чем - там новое всё. В режиме
  // «надолго» вещи и не должны меняться с уровнем, сравнивать нечего
  const changed =
    mode === 'now' && level > MIN_LEVEL ? changedSlots(levels[level - 1], bySlot) : []

  const view: GearView = {
    bySlot,
    changed,
    till: holdsUntil(levels, level),
    long: mode === 'long',
    level,
    open,
    onToggle: (slot) => setOpen((prev) => (prev === slot ? null : slot)),
  }

  const active = findClass(cls)
  const side = findFaction(faction)

  return (
    <div
      className="armory"
      style={cssVars({ '--class-color': active.color, '--room': `url(${side.room})` })}
    >
      <div className="armory__scene" aria-hidden="true" />

      <Masthead
        cls={active}
        faction={side}
        level={level}
        mode={mode}
        onModeChange={(next) => reset({ mode: next })}
      />

      <LevelSlider level={level} onChange={(next) => update({ level: next })} />
      <StaminaSlider cls={cls} stam={stam} onChange={(next) => update({ stam: next })} />
      <LevelDiff mode={mode} level={level} changed={changed} />

      <PaperDoll
        view={view}
        active={active}
        faction={faction}
        cls={cls}
        onFactionChange={(next) => reset({ faction: next })}
        onClassChange={(next) => reset({ cls: next })}
      />

      <section className="doll__weapons">
        {WEAPON_ROW.filter((slot) => bySlot[slot]?.length).map((slot) => (
          <GearRow key={slot} slot={slot} side="left" view={view} />
        ))}
      </section>

      <footer className="footer">
        Только BOE, без профессий · данные клиента TBC Anniversary · иконки Wowhead · оценка по
        ДПС{stam ? ' с поправкой на выживание' : ''}
      </footer>
    </div>
  )
}
