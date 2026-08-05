import { describe, expect, it } from 'vitest'

import type { Item } from '@/data/schema'
import { item } from '@/test/fixture'

import type { LevelMap, SlotVariants, Variant } from './bis'
import { changedSlots, holdsUntil, isLongVariant, longLived, longLivedBySlot } from './diff'

const gear: Item = item()

const variant = (id: number, pct: number, sfx: string | null = null): Variant => ({
  id,
  item: gear,
  sfx,
  stats: {},
  pct,
})

/** Уровни в компактной записи: 20: [[id, pct], ...] - варианты на один слот. */
const levelsOf = (byLevel: Record<number, [number, number][]>): LevelMap =>
  Object.fromEntries(
    Object.entries(byLevel).map(([level, variants]) => [
      level,
      { head: variants.map(([id, pct]) => variant(id, pct)) },
    ]),
  )

describe('changedSlots', () => {
  it('видит смену вещи в слоте', () => {
    const prev = { head: [variant(1, 100)], chest: [variant(3, 100)] }
    const next = { head: [variant(2, 100)], chest: [variant(3, 100)] }

    expect(changedSlots(prev, next)).toEqual(['head'])
  })

  it('считает сменой другой суффикс на том же предмете', () => {
    const prev = { head: [variant(1, 100, 'of the Tiger')] }
    const next = { head: [variant(1, 100, 'of the Bear')] }

    expect(changedSlots(prev, next)).toEqual(['head'])
  })

  it('сравнивает только надетое, порядок замен не важен', () => {
    const prev = { head: [variant(1, 100), variant(2, 90)] }
    const next = { head: [variant(1, 100), variant(3, 80)] }

    expect(changedSlots(prev, next)).toEqual([])
  })

  it('открывшийся слот - это тоже смена', () => {
    expect(changedSlots({}, { head: [variant(1, 100)] })).toEqual(['head'])
  })

  it('пропавший слот не перечисляет: замена всплывёт в другом слоте', () => {
    expect(changedSlots({ head: [variant(1, 100)] }, {})).toEqual([])
  })

  it('переживает отсутствие соседнего уровня', () => {
    const missing: SlotVariants | undefined = undefined
    expect(changedSlots(missing, missing)).toEqual([])
  })
})

describe('holdsUntil', () => {
  it('доводит вещь до последнего уровня, где она ещё лучшая', () => {
    const levels = levelsOf({ 20: [[1, 100]], 21: [[1, 100]], 22: [[2, 100]] })

    expect(holdsUntil(levels, 20).head).toBe(21)
    expect(holdsUntil(levels, 22).head).toBe(22)
  })

  it('на потолке останавливается, дальше уровней нет', () => {
    const levels = levelsOf({ 58: [[1, 100]], 59: [[1, 100]], 60: [[1, 100]] })

    expect(holdsUntil(levels, 58).head).toBe(60)
  })

  it('на пустом уровне ничего не обещает', () => {
    expect(holdsUntil({}, 20)).toEqual({})
  })
})

describe('longLived', () => {
  it('меряет отрезок с текущего уровня, а не с начала', () => {
    const levels = levelsOf({ 20: [[1, 100]], 21: [[1, 100]], 22: [[1, 100]] })

    expect(longLived(levels, 'head', 21)[0]).toMatchObject({ from: 20, to: 22, life: 2 })
  })

  it('отбрасывает варианты слабее 90% от лучшего', () => {
    const levels = levelsOf({
      20: [
        [1, 100],
        [2, 89],
      ],
    })

    expect(longLived(levels, 'head', 20).map((v) => v.id)).toEqual([1])
  })

  it('из нескольких отрезков берёт самый длинный из оставшихся', () => {
    // вещь просела на 22 и вернулась: 20-21 уже позади, живём отрезком 23-25
    const levels = levelsOf({
      20: [[1, 100]],
      21: [[1, 100]],
      22: [[1, 50]],
      23: [[1, 100]],
      24: [[1, 100]],
      25: [[1, 100]],
    })

    expect(longLived(levels, 'head', 23)[0]).toMatchObject({ from: 23, to: 25, life: 3 })
  })

  it('оставляет вещь на вырост - её отрезок начинается позже', () => {
    const levels = levelsOf({ 30: [[1, 100]], 31: [[1, 100]] })

    // жизнь считается по самому отрезку, ожидание до него в неё не входит
    expect(longLived(levels, 'head', 20)[0]).toMatchObject({ from: 30, to: 31, life: 2 })
  })

  it('кончившееся не показывает', () => {
    const levels = levelsOf({ 20: [[1, 100]], 21: [[1, 100]] })

    expect(longLived(levels, 'head', 30)).toEqual([])
  })

  it('при равной жизни вперёд ту, что уже можно надеть', () => {
    const levels: LevelMap = {
      20: { head: [variant(1, 100)] },
      21: { head: [variant(1, 100), variant(2, 100)] },
      22: { head: [variant(1, 100), variant(2, 100)] },
    }

    expect(longLived(levels, 'head', 21).map((v) => v.id)).toEqual([1, 2])
  })
})

describe('longLivedBySlot', () => {
  it('собирает слоты и с уровней сверху - шлема на 20 может ещё не быть', () => {
    const levels: LevelMap = {
      20: { chest: [variant(1, 100)] },
      24: { chest: [variant(1, 100)], head: [variant(2, 100)] },
    }

    expect(Object.keys(longLivedBySlot(levels, 20)).toSorted()).toEqual(['chest', 'head'])
  })

  it('оставляет вещь и десять замен', () => {
    const many: [number, number][] = Array.from({ length: 20 }, (_, i) => [i + 1, 100])

    expect(longLivedBySlot(levelsOf({ 20: many }), 20).head).toHaveLength(11)
  })
})

describe('isLongVariant', () => {
  it('отличает вариант с отрезком от обычного', () => {
    const levels = levelsOf({ 20: [[1, 100]] })

    expect(isLongVariant(variant(1, 100))).toBe(false)
    expect(isLongVariant(longLived(levels, 'head', 20)[0]!)).toBe(true)
  })
})
