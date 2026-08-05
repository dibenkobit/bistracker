import type { ClassId, FactionId, QualityId } from '@/data/schema'

export interface Faction {
  id: FactionId
  name: string
  color: string
  /** герб для кнопки выбора */
  crest: string
  /** задник примерочной */
  room: string
}

export interface CharacterClass {
  id: ClassId
  name: string
  color: string
  icon: string
}

export interface Quality {
  name: string
  color: string
}

// crest - гербы из клиента TBC 2.5.6 (Interface\GLUES\CHARACTERCREATE\
// UI-CharacterCreate-Factions), в современных сборках они перерисованы
// room - задник примерочной (Interface\DRESSUPFRAME\DressUpBackground-Human/Orc),
// собран из четырёх кусков, которыми он лежит в клиенте
export const FACTIONS: readonly Faction[] = [
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

// icon - иконка класса из клиента (Interface\ICONS\ClassIcon_*.blp)
export const CLASSES: readonly CharacterClass[] = [
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

export const QUALITY: Record<QualityId, Quality> = {
  0: { name: 'простой', color: '#9D9D9D' },
  1: { name: 'обычный', color: '#FFFFFF' },
  2: { name: 'необычный', color: '#1EFF00' },
  3: { name: 'редкий', color: '#0070DD' },
  4: { name: 'эпический', color: '#A335EE' },
  5: { name: 'легендарный', color: '#FF8000' },
}

/** Качество приходит числом из данных клиента - незнакомое сводим к зелёному. */
export const quality = (q: QualityId): Quality => QUALITY[q] ?? QUALITY[2]

export const findFaction = (id: FactionId): Faction =>
  FACTIONS.find((f) => f.id === id) ?? FACTIONS[0]!

export const findClass = (id: ClassId): CharacterClass =>
  CLASSES.find((c) => c.id === id) ?? CLASSES[0]!

export const isFactionId = (value: unknown): value is FactionId =>
  FACTIONS.some((f) => f.id === value)

export const isClassId = (value: unknown): value is ClassId =>
  CLASSES.some((c) => c.id === value)
