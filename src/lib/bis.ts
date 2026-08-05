import type { BisData, ClassId, FactionId, Item, ListEntry, SlotId, Stats } from '@/data/schema'

import { entriesOf } from './object'

/**
 * Вариант на слот: строка из данных, у которой уже разрешён предмет. Дальше по
 * дереву компонентов ходит именно он - лазить в `data.items` больше некому.
 */
export interface Variant {
  /** id предмета: по нему строится ссылка на Wowhead */
  id: number
  item: Item
  /** случайный суффикс вроде «of the Tiger», если он есть */
  sfx: string | null
  /** статы самого богатого ролла */
  stats: Stats
  /** статы самого бедного ролла - только у вещей с суффиксом */
  low?: Stats
  /** сколько от лучшего варианта на уровне остаётся, % */
  pct: number
  /** края вилки ролла в процентах - если разброс вообще влияет на оценку */
  lo?: number
  hi?: number
}

/** Слот -> варианты, лучший первым. */
export type SlotVariants = Partial<Record<SlotId, Variant[]>>

/** Уровень -> что на нём надето. */
export type LevelMap = Record<number, SlotVariants>

const required = <T>(value: T | undefined, what: string): T => {
  if (value === undefined) throw new Error(`битые данные: ${what}`)
  return value
}

const toVariant = (data: BisData, [rowId, pct, lo, hi]: ListEntry): Variant => {
  const row = required(data.rows[rowId], `нет строки ${rowId}`)
  return {
    id: row.item,
    item: required(data.items[row.item], `нет предмета ${row.item}`),
    sfx: row.sfx,
    stats: row.stats,
    low: row.low,
    pct,
    lo,
    hi,
  }
}

/**
 * На каждое положение ползунка выносливости в данных лежат свои списки. И
 * строки, и сами списки повторяются на разных уровнях, поэтому хранятся по
 * одному разу, а уровень ссылается на них номерами - разворачиваем.
 */
export function expandLevels(
  data: BisData,
  faction: FactionId,
  cls: ClassId,
  stam: number,
): LevelMap {
  const source = data.bis[faction]?.[cls] ?? {}
  const levels: LevelMap = {}

  for (const [level, steps] of Object.entries(source)) {
    const setup = steps[stam]
    if (!setup) continue

    const slots: SlotVariants = {}
    for (const [slot, listId] of entriesOf(setup)) {
      const list = required(data.lists[listId], `нет списка ${listId}`)
      slots[slot] = list.map((entry) => toVariant(data, entry))
    }
    levels[Number(level)] = slots
  }

  return levels
}

/** Название вместе со случайным суффиксом: «Green Silk Armor of the Tiger». */
export const fullName = ({ item, sfx }: Variant): string =>
  sfx ? `${item.name} ${sfx}` : item.name

/**
 * Роллящаяся вещь даёт не фиксированное число, а вилку - в сумме считаем её
 * серединой, иначе итог был бы по одному везучему роллу на каждый слот.
 */
export function totalStats(slots: SlotVariants): Stats {
  const totals: Stats = {}

  for (const variants of Object.values(slots)) {
    const worn = variants[0]
    if (!worn) continue

    for (const [stat, value] of entriesOf(worn.stats)) {
      totals[stat] = (totals[stat] ?? 0) + (value + (worn.low?.[stat] ?? value)) / 2
    }
  }

  return totals
}
