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

// Рубашка и накидка на статы не влияют, поэтому в данных их нет и не будет.
// Стоят пустыми - без них экран персонажа не тот.
export type CosmeticId = 'shirt' | 'tabard'

export const COSMETIC: Record<CosmeticId, { name: string; icon: string }> = {
  shirt: { name: 'Рубашка', icon: 'inventoryslot_shirt' },
  tabard: { name: 'Накидка', icon: 'inventoryslot_tabard' },
}

export const isCosmetic = (slot: SlotId | CosmeticId): slot is CosmeticId => slot in COSMETIC

// левая и правая колонки как на экране персонажа
export const LEFT_COLUMN: readonly (SlotId | CosmeticId)[] = [
  'head',
  'neck',
  'shoulder',
  'back',
  'chest',
  'shirt',
  'tabard',
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
