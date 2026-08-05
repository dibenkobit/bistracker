// Что меняется при переходе на уровень выше. Списки уже посчитаны на каждый
// уровень, разница между соседними - это и есть план прокачки.

import type { SlotId } from '@/data/schema'
import { MAX_LEVEL, MIN_LEVEL } from '@/game'

import type { LevelMap, SlotVariants, Variant } from './bis'
import { keysOf } from './object'

/** Вещь та же самая, если совпали предмет и суффикс. */
const key = (variant: Variant | undefined): string | null =>
  variant ? `${variant.id}:${variant.sfx ?? ''}` : null

/** В слоте лежит список вариантов, первый - лучший; сравниваем именно его. */
const worn = (slots: SlotVariants | undefined, slot: SlotId): Variant | undefined =>
  slots?.[slot]?.[0]

/**
 * Слоты, которые меняются при переходе prev -> next. Пропавшие слоты не
 * перечисляем: замена всплывает сама - когда двуручное меняется на пару
 * одноручных, в списке оказываются правая и левая рука.
 */
export function changedSlots(
  prev: SlotVariants | undefined,
  next: SlotVariants | undefined,
): SlotId[] {
  return keysOf(next ?? {}).filter((slot) => key(worn(prev, slot)) !== key(worn(next, slot)))
}

/** Вещь считаем годной, пока от лучшей на этом уровне остаётся хотя бы столько. */
const NEAR = 90

/** Подряд идущие уровни в отрезки: [10,11,12,15,16] -> [[10,12],[15,16]]. */
const runs = (levels: number[]): [number, number][] =>
  levels.reduce<[number, number][]>((acc, level) => {
    const last = acc.at(-1)
    if (last && level === last[1] + 1) last[1] = level
    else acc.push([level, level])
    return acc
  }, [])

/** Вариант с отрезком уровней, на которых он держится. */
export interface LongVariant extends Variant {
  /** первый уровень отрезка - у вещи на вырост он больше текущего */
  from: number
  /** последний уровень, где вещь ещё в пределах 10% от лучшей */
  to: number
  /** сколько уровней отрезка осталось, считая с текущего */
  life: number
}

export const isLongVariant = (variant: Variant): variant is LongVariant => 'life' in variant

/**
 * Что взять в слот, чтобы подольше не трогать: у каждой вещи берём отрезок
 * уровней, где она держится в пределах 10% от лучшей, и меряем, сколько от
 * него осталось с нашего уровня. Вещь на вырост сюда тоже попадает - её
 * отрезок просто начинается позже, и это видно по полоске.
 */
export function longLived(levels: LevelMap, slot: SlotId, level: number): LongVariant[] {
  const seen = new Map<string, { variant: Variant; levels: number[] }>()

  for (let lvl = MIN_LEVEL; lvl <= MAX_LEVEL; lvl++) {
    for (const variant of levels[lvl]?.[slot] ?? []) {
      if (variant.pct < NEAR) continue
      const id = key(variant) ?? ''
      const entry = seen.get(id) ?? { variant, levels: [] }
      entry.levels.push(lvl)
      seen.set(id, entry)
    }
  }

  const life = ([from, to]: [number, number]) => to - Math.max(from, level) + 1
  const out: LongVariant[] = []

  for (const { variant, levels: lvls } of seen.values()) {
    // отрезков бывает несколько - вещь может просесть и снова всплыть.
    // Кончившиеся не в счёт, из оставшихся берём тот, что даст больше уровней
    const span = runs(lvls)
      .filter(([, to]) => to >= level)
      .toSorted((a, b) => life(b) - life(a))[0]
    if (span) out.push({ ...variant, from: span[0], to: span[1], life: life(span) })
  }

  // при равной жизни вперёд ту, что уже можно надеть
  return out.toSorted((a, b) => b.life - a.life || a.from - b.from)
}

/** Сколько долгожителей показывать на слот: сама вещь и до десяти замен. */
const PER_SLOT = 11

/**
 * Режим «надолго» целиком: слот -> долгожители. Слот может открыться позже
 * нашего уровня - шлемов до 24 в игре нет, - поэтому собираем слоты со всех
 * уровней сверху, иначе такой слот остался бы пустым.
 */
export function longLivedBySlot(levels: LevelMap, level: number): SlotVariants {
  const slots = new Set<SlotId>()
  for (let lvl = level; lvl <= MAX_LEVEL; lvl++) {
    for (const slot of keysOf(levels[lvl] ?? {})) slots.add(slot)
  }

  const out: SlotVariants = {}
  for (const slot of slots) out[slot] = longLived(levels, slot, level).slice(0, PER_SLOT)
  return out
}

/**
 * До какого уровня каждая вещь остаётся лучшей: slot -> уровень. Это и есть
 * ответ на «стоит ли брать» - списки тут меняются почти каждый уровень, и
 * общего «следующая замена» не существует, а по слотам разброс большой.
 */
export function holdsUntil(levels: LevelMap, level: number): Partial<Record<SlotId, number>> {
  const till: Partial<Record<SlotId, number>> = {}

  for (const slot of keysOf(levels[level] ?? {})) {
    const now = key(worn(levels[level], slot))
    let lvl = level
    while (lvl < MAX_LEVEL && key(worn(levels[lvl + 1], slot)) === now) lvl++
    till[slot] = lvl
  }

  return till
}
