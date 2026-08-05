import { describe, expect, it } from 'vitest'

import type { BisData } from '@/data/schema'
import { item, makeData, row } from '@/test/fixture'

import { expandLevels, fullName, totalStats } from './bis'

/** Развёрнутые списки на один уровень - в тестах он у нас всегда один. */
const at = (source: BisData, stam: number, level = 20) =>
  expandLevels(source, 'alliance', 'rogue', stam)[level] ?? {}

const data = makeData({
  items: { 100: item({ name: 'Кинжал' }), 200: item({ name: 'Кольцо' }) },
  rows: [
    row(100, { Agility: 10 }),
    row(200, { Agility: 4 }, { sfx: 'of the Tiger', low: { Agility: 2 } }),
  ],
  lists: [
    [
      [0, 100],
      [1, 80, 60, 100],
    ],
  ],
  bis: { rogue: { 20: [{ mainhand: 0 }, { mainhand: 0 }, {}, {}] } },
})

describe('expandLevels', () => {
  it('разворачивает номера строк в варианты с разрешённым предметом', () => {
    const variants = at(data, 0).mainhand ?? []

    expect(variants).toHaveLength(2)
    expect(variants[0]).toMatchObject({ id: 100, pct: 100, sfx: null })
    expect(variants[0]?.item.name).toBe('Кинжал')
    expect(variants[1]).toMatchObject({ id: 200, pct: 80, lo: 60, hi: 100 })
  })

  it('берёт набор под выбранное положение ползунка выносливости', () => {
    expect(at(data, 2)).toEqual({})
  })

  it('на неизвестном классе или фракции отдаёт пустоту, а не падает', () => {
    expect(expandLevels(data, 'horde', 'rogue', 0)).toEqual({})
    expect(expandLevels(data, 'alliance', 'mage', 0)).toEqual({})
  })

  it('ругается на битую ссылку внутри данных', () => {
    const broken = makeData({
      items: {},
      rows: [row(999, {})],
      lists: [[[0, 100]]],
      bis: { rogue: { 20: [{ head: 0 }] } },
    })
    expect(() => expandLevels(broken, 'alliance', 'rogue', 0)).toThrow(/нет предмета 999/u)
  })
})

describe('fullName', () => {
  it('приклеивает случайный суффикс к названию', () => {
    const [worn, rolled] = at(data, 0).mainhand ?? []

    expect(fullName(worn!)).toBe('Кинжал')
    expect(fullName(rolled!)).toBe('Кольцо of the Tiger')
  })
})

describe('totalStats', () => {
  it('считает только надетое, замены в сумму не идут', () => {
    expect(totalStats(at(data, 0))).toEqual({ Agility: 10 })
  })

  it('роллящуюся вещь берёт по середине вилки', () => {
    const rolled = makeData({
      items: { 200: item() },
      rows: [row(200, { Agility: 4 }, { low: { Agility: 2 } })],
      lists: [[[0, 100]]],
      bis: { rogue: { 20: [{ finger1: 0 }] } },
    })
    expect(totalStats(at(rolled, 0))).toEqual({ Agility: 3 })
  })
})
