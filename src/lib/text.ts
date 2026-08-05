import type { SlotId, StatKey, Stats } from '@/data/schema'
import { MAX_LEVEL, SLOTS } from '@/game'

import type { LongVariant } from './diff'

/** В предложении названия слотов идут строчными, кольца не дублируются. */
export const slotList = (slots: readonly SlotId[]): string =>
  [...new Set(slots.map((slot) => SLOTS[slot].toLowerCase()))].join(', ')

/**
 * Вещи тут живут по-разному: одна до 44, другую меняешь на следующем уровне.
 * `till` - последний уровень, где вещь ещё лучшая, а называем всегда уровень
 * замены: иначе на самом `till` текст менялся бы с «до 22» на «сменится на 23»
 * и выглядел бы как расхождение. На потолке говорить нечего - дальше уровней нет.
 */
export const holdText = (till: number | undefined): string =>
  till !== undefined && till < MAX_LEVEL ? `сменится на ${till + 1}` : ''

/**
 * «до 41 · 18 ур.», а вещи на вырост - ещё и с какого уровня её носить.
 * Сокращаем «ур.» из-за склонения: было бы «21 уровень», но «18 уровней».
 */
export const spanText = ({ from, to, life }: LongVariant, level: number): string =>
  (from > level ? `с ${from} ` : '') +
  (to >= MAX_LEVEL ? 'до конца' : `до ${to}`) +
  ` · ${life} ур.`

/**
 * У роллящейся вещи стат пишется вилкой: «+3-4 к ловкости». `low` - самый
 * бедный ролл, `stats` - самый богатый, между ними и лежит то, что достанется.
 */
export const statText = (stats: Stats, low: Stats | undefined, key: StatKey): string => {
  const high = Math.round(stats[key] ?? 0)
  const min = Math.round(low?.[key] ?? stats[key] ?? 0)
  return min === high ? `${high}` : `${min}-${high}`
}
