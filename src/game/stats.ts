import type { ClassId, StatKey } from '@/data/schema'

export const STAT_NAMES: Record<StatKey, string> = {
  Strength: 'Сила',
  Agility: 'Ловкость',
  Stamina: 'Выносливость',
  Intellect: 'Интеллект',
  Spirit: 'Дух',
  AttackPower: 'Сила атаки',
  RangedAttackPower: 'Сила атаки (дальний бой)',
  SpellDamage: 'Урон заклинаний',
  SpellDamageArcane: 'Урон заклинаний (тайная магия)',
  SpellDamageFire: 'Урон заклинаний (огонь)',
  SpellDamageFrost: 'Урон заклинаний (лед)',
  SpellDamageNature: 'Урон заклинаний (природа)',
  SpellDamageShadow: 'Урон заклинаний (тьма)',
  SpellDamageHoly: 'Урон заклинаний (свет)',
  PhysDamageDone: 'Физический урон',
  HealingPower: 'Сила исцеления',
  CritRating: 'Рейтинг крит. удара',
  MeleeCritRating: 'Рейтинг крит. удара (ближний бой)',
  RangedCritRating: 'Рейтинг крит. удара (дальний бой)',
  HitRating: 'Рейтинг меткости',
  MeleeHitRating: 'Рейтинг меткости (ближний бой)',
  RangedHitRating: 'Рейтинг меткости (дальний бой)',
  SpellCritRating: 'Рейтинг крита заклинаний',
  SpellHitRating: 'Рейтинг меткости заклинаний',
  'MeleeCrit%': 'Крит. удар, %',
  'SpellCrit%': 'Крит. удар заклинаний, %',
  'HitChance%': 'Меткость, %',
  DefenseRating: 'Рейтинг защиты',
  Expertise: 'Мастерство',
  Armor: 'Броня',
  WeaponDPS: 'Урон в секунду',
  RangedWeaponDPS: 'Урон в секунду (дальний бой)',
  WeaponFlatDamage: 'Дополнительный урон',
  MP5: 'Мана раз в 5 сек.',
  Health: 'Здоровье',
  Mana: 'Мана',
}

/** Что показываем в сводке и в каком порядке. */
export const SUMMARY_STATS: readonly StatKey[] = [
  'Strength',
  'Agility',
  'Stamina',
  'Intellect',
  'Spirit',
  'AttackPower',
  'SpellDamage',
  'SpellDamageArcane',
  'SpellDamageFire',
  'SpellDamageFrost',
  'SpellDamageNature',
  'SpellDamageShadow',
  'SpellDamageHoly',
  'CritRating',
  'MeleeCritRating',
  'RangedCritRating',
  'HitRating',
  'MeleeHitRating',
  'RangedHitRating',
  'Armor',
]

export interface StaminaStep {
  label: string
  hint: string
}

// положения ползунка выносливости, порядок тот же, что в STAMINA_STEPS в
// tools/bis.py: сколько выносливость стоит в долях главного стата класса
export const STAMINA_STEPS: readonly StaminaStep[] = [
  {
    label: 'не считаем',
    hint: 'чистый ДПС, как считает симулятор — это для группы и данжей',
  },
  { label: 'четверть', hint: 'четверть главного стата' },
  { label: 'половина', hint: 'половина главного стата' },
  { label: 'наравне', hint: 'выносливость наравне с главным статом' },
]

// что советуем качающемуся в одиночку. Тем, кто бьёт издалека, запаса жизни
// нужно меньше: по ним просто реже попадают
export const SOLO_STEP: Record<ClassId, number> = {
  warrior: 2,
  paladin: 2,
  rogue: 2,
  shaman: 2,
  druid: 2,
  hunter: 1,
  mage: 1,
  warlock: 1,
  priest: 1,
}

export const SOLO_WHY: Record<number, string> = {
  1: 'ты бьёшь издалека, и по тебе реже попадают',
  2: 'ты стоишь в ближнем бою, а умереть дороже, чем бить дольше',
}

export const isStaminaStep = (value: number): boolean =>
  Number.isInteger(value) && value >= 0 && value < STAMINA_STEPS.length
