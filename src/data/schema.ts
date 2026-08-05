// Формат src/data/bis.json - его собирает tools/export.py. Файл приходит по
// сети и приводится к этим типам в одном месте (loadBisData), дальше по
// приложению он ходит уже типизированным.

export type FactionId = 'alliance' | 'horde'

export type ClassId =
  | 'warrior'
  | 'paladin'
  | 'hunter'
  | 'rogue'
  | 'priest'
  | 'shaman'
  | 'mage'
  | 'warlock'
  | 'druid'

export type SlotId =
  | 'head'
  | 'neck'
  | 'shoulder'
  | 'back'
  | 'chest'
  | 'wrist'
  | 'hands'
  | 'waist'
  | 'legs'
  | 'feet'
  | 'finger1'
  | 'finger2'
  | 'trinket1'
  | 'trinket2'
  | 'mainhand'
  | 'offhand'
  | 'twohand'
  | 'ranged'

// Всё, что умеет выдавать генератор (WEIGHTS и RATING в tools/bis.py). Union
// закрыт нарочно: добавится стат - TypeScript потребует и русское название
// в STAT_NAMES, и решение, показывать ли его в сводке.
export type StatKey =
  | 'Strength'
  | 'Agility'
  | 'Stamina'
  | 'Intellect'
  | 'Spirit'
  | 'AttackPower'
  | 'RangedAttackPower'
  | 'SpellDamage'
  | 'SpellDamageArcane'
  | 'SpellDamageFire'
  | 'SpellDamageFrost'
  | 'SpellDamageNature'
  | 'SpellDamageShadow'
  | 'SpellDamageHoly'
  | 'PhysDamageDone'
  | 'HealingPower'
  | 'CritRating'
  | 'MeleeCritRating'
  | 'RangedCritRating'
  | 'HitRating'
  | 'MeleeHitRating'
  | 'RangedHitRating'
  | 'SpellCritRating'
  | 'SpellHitRating'
  | 'MeleeCrit%'
  | 'SpellCrit%'
  | 'HitChance%'
  | 'DefenseRating'
  | 'Expertise'
  | 'Armor'
  | 'WeaponDPS'
  | 'RangedWeaponDPS'
  | 'WeaponFlatDamage'
  | 'MP5'
  | 'Health'
  | 'Mana'

export type Stats = Partial<Record<StatKey, number>>

/** Качество: 0 серое, 1 белое, 2 зелёное, 3 синее, 4 фиолетовое, 5 оранжевое. */
export type QualityId = 0 | 1 | 2 | 3 | 4 | 5

export interface Item {
  name: string
  q: QualityId
  /** требуемый уровень персонажа */
  lvl: number
  /** уровень предмета */
  ilvl: number
  /** имя файла иконки на CDN Wowhead */
  icon: string
  /** InventoryType из клиента */
  inv: number
  /** класс и подкласс предмета: 2.15 - кинжал, 4.2 - кожа */
  cls: number
  sub: number
  boe: boolean
  uniq: boolean
  display: number
  armor?: number
  dura?: number
  /** урон и скорость есть только у оружия */
  dmin?: number
  dmax?: number
  speed?: number
}

/** Предмет, у которого есть строка урона: три поля всегда идут вместе. */
export type Weapon = Item & { dmin: number; dmax: number; speed: number }

export const isWeapon = (item: Item): item is Weapon => item.speed !== undefined

/** Вещь со всеми статами: одна строка хранится один раз на весь файл. */
export interface Row {
  item: number
  /** случайный суффикс вроде «of the Tiger», если он есть */
  sfx: string | null
  /** самый богатый ролл, если вилка есть */
  stats: Stats
  /** самый бедный ролл; появляется только у вещей с суффиксом */
  low?: Stats
}

// Номер строки и сколько от лучшего варианта остаётся, %. У роллящейся вещи
// после среднего процента идут края вилки - бедный и богатый ролл.
export type ListEntry =
  | readonly [row: number, pct: number]
  | readonly [row: number, pct: number, lo: number, hi: number]

/** Слот -> номер списка в `lists`. */
export type SlotSetup = Partial<Record<SlotId, number>>

export interface BisData {
  items: Record<string, Item>
  /** положения ползунка выносливости в долях главного стата класса */
  stam: number[]
  rows: Row[]
  lists: ListEntry[][]
  /** фракция -> класс -> уровень -> набор на каждое положение ползунка */
  bis: Record<FactionId, Record<ClassId, Record<string, SlotSetup[]>>>
}
