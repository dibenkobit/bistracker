import type { SlotId } from '@/data/schema'

export const SLOTS: Record<SlotId, string> = {
  head: 'Голова',
  neck: 'Шея',
  shoulder: 'Плечи',
  back: 'Спина',
  chest: 'Грудь',
  wrist: 'Запястья',
  hands: 'Кисти рук',
  waist: 'Пояс',
  legs: 'Ноги',
  feet: 'Ступни',
  finger1: 'Палец',
  finger2: 'Палец',
  trinket1: 'Аксессуар',
  trinket2: 'Аксессуар',
  mainhand: 'Правая рука',
  offhand: 'Левая рука',
  twohand: 'Двуручное',
  ranged: 'Дальний бой',
}

// заглушки пустых слотов - те же текстуры, что в самой игре
// (Interface\PaperDoll\UI-PaperDoll-Slot-*). Спина в игре берёт текстуру груди,
// двуручное - правой руки, отдельных у них нет.
export const SLOT_ICON: Record<SlotId, string> = {
  head: 'inventoryslot_head',
  neck: 'inventoryslot_neck',
  shoulder: 'inventoryslot_shoulder',
  back: 'inventoryslot_chest',
  chest: 'inventoryslot_chest',
  wrist: 'inventoryslot_wrists',
  hands: 'inventoryslot_hands',
  waist: 'inventoryslot_waist',
  legs: 'inventoryslot_legs',
  feet: 'inventoryslot_feet',
  finger1: 'inventoryslot_finger',
  finger2: 'inventoryslot_finger',
  trinket1: 'inventoryslot_trinket',
  trinket2: 'inventoryslot_trinket',
  mainhand: 'inventoryslot_mainhand',
  offhand: 'inventoryslot_offhand',
  twohand: 'inventoryslot_mainhand',
  ranged: 'inventoryslot_ranged',
}

// левая и правая колонки как на экране персонажа
export const LEFT_COLUMN: readonly SlotId[] = [
  'head',
  'neck',
  'shoulder',
  'back',
  'chest',
  'wrist',
]
export const RIGHT_COLUMN: readonly SlotId[] = [
  'hands',
  'waist',
  'legs',
  'feet',
  'finger1',
  'finger2',
  'trinket1',
  'trinket2',
]
export const WEAPON_ROW: readonly SlotId[] = ['mainhand', 'offhand', 'twohand', 'ranged']

/** С какой стороны от центра стоит колонка - от этого зависит вёрстка строки. */
export type Side = 'left' | 'right'
