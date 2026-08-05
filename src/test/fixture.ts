// Маленький набор данных того же формата, что bis.json. Настоящий файл весит
// четыре мегабайта - гонять его в каждом тесте незачем, а проверять надо
// логику, а не содержимое.

import type { BisData, ClassId, Item, ListEntry, Row, SlotSetup, Stats } from '@/data/schema'

export const item = (over: Partial<Item> = {}): Item => ({
  name: 'Предмет',
  q: 2,
  lvl: 10,
  ilvl: 15,
  icon: 'icon',
  inv: 1,
  cls: 4,
  sub: 2,
  boe: true,
  uniq: false,
  display: 1,
  ...over,
})

export const row = (id: number, stats: Stats, over: Partial<Row> = {}): Row => ({
  item: id,
  sfx: null,
  stats,
  ...over,
})

interface FixtureSpec {
  items: Record<number, Item>
  rows: Row[]
  lists: ListEntry[][]
  /** класс -> уровень -> набор на каждое положение ползунка выносливости */
  bis: Partial<Record<ClassId, Record<number, SlotSetup[]>>>
}

export const makeData = ({ items, rows, lists, bis }: FixtureSpec): BisData => ({
  items,
  stam: [0, 0.25, 0.5, 1],
  rows,
  lists,
  bis: { alliance: bis, horde: {} },
})
