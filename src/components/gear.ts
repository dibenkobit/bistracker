import type { SlotId } from '@/data/schema'
import type { SlotVariants } from '@/lib/bis'

/**
 * Всё, что нужно строке экипировки и списку замен: слотов на экране под
 * двадцать, и таскать эти семь полей через каждый из них по отдельности
 * читается хуже, чем один общий вид.
 */
export interface GearView {
  /** слот -> варианты, лучший первым */
  bySlot: SlotVariants
  /** слоты, поменявшиеся при переходе с прошлого уровня */
  changed: readonly SlotId[]
  /** слот -> последний уровень, где вещь ещё лучшая */
  till: Partial<Record<SlotId, number>>
  /** режим «надолго»: вместо процентов - отрезки жизни */
  long: boolean
  level: number
  /** слот с раскрытым списком замен; открыт всегда не больше одного */
  open: SlotId | null
  onToggle: (slot: SlotId) => void
}
