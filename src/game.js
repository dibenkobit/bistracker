// icon - иконка класса из клиента (Interface\ICONS\ClassIcon_*.blp)
// crest - гербы из клиента TBC 2.5.6 (Interface\GLUES\CHARACTERCREATE\
// UI-CharacterCreate-Factions), в современных сборках они перерисованы
// room - задник примерочной (Interface\DRESSUPFRAME\DressUpBackground-Human/Orc),
// собран из четырёх кусков, которыми он лежит в клиенте
export const FACTIONS = [
  {
    id: 'alliance',
    name: 'Альянс',
    color: '#3d7fd6',
    crest: '/img/alliance.png',
    room: '/img/room-alliance.png',
  },
  {
    id: 'horde',
    name: 'Орда',
    color: '#c4362b',
    crest: '/img/horde.png',
    room: '/img/room-horde.png',
  },
]

export const CLASSES = [
  { id: 'warrior', name: 'Воин', color: '#C79C6E', icon: 'classicon_warrior' },
  { id: 'paladin', name: 'Паладин', color: '#F58CBA', icon: 'classicon_paladin' },
  { id: 'hunter', name: 'Охотник', color: '#ABD473', icon: 'classicon_hunter' },
  { id: 'rogue', name: 'Разбойник', color: '#FFF569', icon: 'classicon_rogue' },
  { id: 'priest', name: 'Жрец', color: '#FFFFFF', icon: 'classicon_priest' },
  { id: 'shaman', name: 'Шаман', color: '#0070DE', icon: 'classicon_shaman' },
  { id: 'mage', name: 'Маг', color: '#69CCF0', icon: 'classicon_mage' },
  { id: 'warlock', name: 'Чернокнижник', color: '#9482C9', icon: 'classicon_warlock' },
  { id: 'druid', name: 'Друид', color: '#FF7D0A', icon: 'classicon_druid' },
]

export const QUALITY = {
  0: { name: 'простой', color: '#9D9D9D' },
  1: { name: 'обычный', color: '#FFFFFF' },
  2: { name: 'необычный', color: '#1EFF00' },
  3: { name: 'редкий', color: '#0070DD' },
  4: { name: 'эпический', color: '#A335EE' },
  5: { name: 'легендарный', color: '#FF8000' },
}

export const SLOTS = {
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
export const SLOT_ICON = {
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
export const LEFT_COLUMN = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist']
export const RIGHT_COLUMN = [
  'hands', 'waist', 'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2',
]
export const WEAPON_ROW = ['mainhand', 'offhand', 'twohand', 'ranged']

// два взгляда на один и тот же список: что лучше прямо сейчас и что стоит
// покупать - вещь, которая продержится дольше всех, редко бывает лучшей
export const MODES = [
  { id: 'now', label: 'Сейчас', hint: 'Лучшее на этом уровне' },
  { id: 'long', label: 'Надолго', hint: 'Что дольше всех держится в пределах 10% от лучшего' },
]

// положения ползунка выносливости, порядок тот же, что в STAMINA_STEPS в
// tools/bis.py: сколько выносливость стоит в долях главного стата класса
export const STAMINA_STEPS = [
  { label: 'не считаем', hint: 'чистый ДПС, как считает симулятор — это для группы и данжей' },
  { label: 'четверть', hint: 'четверть главного стата' },
  { label: 'половина', hint: 'половина главного стата' },
  { label: 'наравне', hint: 'выносливость наравне с главным статом' },
]

// что советуем качающемуся в одиночку. Тем, кто бьёт издалека, запаса жизни
// нужно меньше: по ним просто реже попадают
export const SOLO_STEP = {
  warrior: 2, paladin: 2, rogue: 2, shaman: 2, druid: 2,
  hunter: 1, mage: 1, warlock: 1, priest: 1,
}

export const SOLO_WHY = {
  1: 'ты бьёшь издалека, и по тебе реже попадают',
  2: 'ты стоишь в ближнем бою, а умереть дороже, чем бить дольше',
}

export const STAT_NAMES = {
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

// что показываем в сводке и в каком порядке
export const SUMMARY_STATS = [
  'Strength', 'Agility', 'Stamina', 'Intellect', 'Spirit',
  'AttackPower', 'SpellDamage', 'SpellDamageArcane', 'SpellDamageFire',
  'SpellDamageFrost', 'SpellDamageNature', 'SpellDamageShadow', 'SpellDamageHoly',
  'CritRating', 'MeleeCritRating', 'RangedCritRating',
  'HitRating', 'MeleeHitRating', 'RangedHitRating', 'Armor',
]

// ---------- тултип как в игре ----------
// Названия и формулировки ниже сверены с русскими тултипами клиента TBC,
// свои переводы не выдумывались.

// InventoryType -> левая ячейка первой строки тултипа
export const INV_TYPE = {
  1: 'Голова', 2: 'Шея', 3: 'Плечи', 5: 'Грудь', 6: 'Пояс', 7: 'Ноги',
  8: 'Ступни', 9: 'Запястья', 10: 'Кисти рук', 11: 'Палец', 12: 'Аксессуар',
  13: 'Одноручное', 14: 'Левая рука', 15: 'Дальний бой', 16: 'Спина',
  17: 'Двуручное', 20: 'Грудь', 21: 'Правая рука', 22: 'Левая рука',
  23: 'Левая рука', 25: 'Метательное оружие', 26: 'Дальний бой',
}

// class.subclass -> правая ячейка (тип брони или оружия)
export const ITEM_SUBTYPE = {
  '2.0': 'Топор', '2.1': 'Топор', '2.2': 'Лук', '2.3': 'Огнестрельное',
  '2.4': 'Дробящее', '2.5': 'Дробящее', '2.6': 'Древковое', '2.7': 'Меч',
  '2.8': 'Меч', '2.10': 'Посох', '2.13': 'Кистевое оружие', '2.15': 'Кинжал',
  '2.16': 'Метательное', '2.18': 'Арбалет', '2.19': 'Жезл',
  '4.1': 'Ткань', '4.2': 'Кожа', '4.3': 'Кольчуга', '4.4': 'Латы', '4.6': 'Щит',
}

// базовые характеристики идут белой строкой "+N к <дательный падеж>"
export const BASE_STATS = {
  Strength: 'силе',
  Agility: 'ловкости',
  Stamina: 'выносливости',
  Intellect: 'интеллекту',
  Spirit: 'духу',
}

// остальное - зелёные строки "Если на персонаже: ..."
const schoolDamage = (school, v) =>
  `Увеличивает урон от заклинаний и эффектов школы магии «${school}» максимум на ${v} ед.`

export const EQUIP_EFFECT = {
  AttackPower: (v) => `Повышает силу атаки на ${v}.`,
  RangedAttackPower: (v) => `Увеличивает силу атак дальнего боя на ${v}.`,
  SpellDamage: (v) =>
    `Увеличивает урон и объем исцеления от магических заклинаний и эффектов максимум на ${v} ед.`,
  SpellDamageArcane: (v) => schoolDamage('Тайная магия', v),
  SpellDamageFire: (v) => schoolDamage('Огонь', v),
  SpellDamageFrost: (v) => schoolDamage('Лед', v),
  SpellDamageNature: (v) => schoolDamage('Природа', v),
  SpellDamageShadow: (v) => schoolDamage('Тьма', v),
  SpellDamageHoly: (v) => schoolDamage('Свет', v),
  CritRating: (v) => `Повышает рейтинг критического удара на ${v}.`,
  MeleeCritRating: (v) => `Повышает рейтинг критического удара в ближнем бою на ${v}.`,
  RangedCritRating: (v) => `Повышает рейтинг критического удара дальнего боя на ${v}.`,
  HitRating: (v) => `Повышает рейтинг меткости на ${v}.`,
  MeleeHitRating: (v) => `Повышает рейтинг меткости в ближнем бою на ${v}.`,
  RangedHitRating: (v) => `Повышает рейтинг меткости дальнего боя на ${v}.`,
  SpellCritRating: (v) => `Критический удар (заклинания) +${v}.`,
  SpellHitRating: (v) => `Меткость (заклинания) +${v}.`,
  Expertise: (v) => `Повышает рейтинг мастерства на ${v}.`,
  MP5: (v) => `Восполнение ${v} ед. маны за 5 сек.`,
}

export const wowheadUrl = (id) => `https://www.wowhead.com/tbc/item=${id}`

export const iconUrl = (icon) =>
  `https://wow.zamimg.com/images/wow/icons/large/${icon ?? 'inv_misc_questionmark'}.jpg`
