import { describe, expect, it } from 'vitest'

import { item } from '@/test/fixture'

import type { LongVariant } from './diff'
import { holdText, slotList, spanText, statText } from './text'

const long = (from: number, to: number, life: number): LongVariant => ({
  id: 1,
  item: item(),
  sfx: null,
  stats: {},
  pct: 100,
  from,
  to,
  life,
})

describe('slotList', () => {
  it('пишет слоты строчными и не дублирует кольца', () => {
    expect(slotList(['chest', 'finger1', 'finger2'])).toBe('грудь, палец')
  })
})

describe('holdText', () => {
  it('называет уровень замены, а не последний уровень жизни', () => {
    expect(holdText(22)).toBe('сменится на 23')
  })

  it('на потолке молчит: дальше уровней нет', () => {
    expect(holdText(60)).toBe('')
  })

  it('молчит и когда срок неизвестен', () => {
    expect(holdText(undefined)).toBe('')
  })
})

describe('spanText', () => {
  it('вещь на вырост подписывает начальным уровнем', () => {
    expect(spanText(long(33, 45, 13), 20)).toBe('с 33 до 45 · 13 ур.')
  })

  it('дотянувшую до потолка называет «до конца»', () => {
    expect(spanText(long(33, 60, 28), 33)).toBe('до конца · 28 ур.')
  })
})

describe('statText', () => {
  it('фиксированный стат пишет числом', () => {
    expect(statText({ Agility: 7 }, undefined, 'Agility')).toBe('7')
  })

  it('роллящийся - вилкой от бедного ролла к богатому', () => {
    expect(statText({ Agility: 4.2 }, { Agility: 2.7 }, 'Agility')).toBe('3-4')
  })

  it('сходящуюся вилку не разворачивает', () => {
    expect(statText({ Agility: 4 }, { Agility: 4 }, 'Agility')).toBe('4')
  })
})
