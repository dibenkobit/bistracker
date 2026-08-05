import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { readState, stateToSearch, useUrlState } from './useUrlState'

describe('readState', () => {
  it('без параметров даёт разбойника 40 уровня за Альянс', () => {
    expect(readState('')).toEqual({
      cls: 'rogue',
      faction: 'alliance',
      level: 40,
      stam: 2,
      mode: 'now',
    })
  })

  it('читает всё, что записано в адресе', () => {
    expect(readState('?faction=horde&class=mage&level=25&stam=0&mode=long')).toEqual({
      cls: 'mage',
      faction: 'horde',
      level: 25,
      stam: 0,
      mode: 'long',
    })
  })

  it('без stam ставит совет для соло - у своего класса он свой', () => {
    expect(readState('?class=mage').stam).toBe(1)
    expect(readState('?class=warrior').stam).toBe(2)
  })

  it('пустой stam - это ноль, а не «параметра нет»', () => {
    expect(readState('?class=warrior&stam=0').stam).toBe(0)
  })

  it('мусор в адресе заменяет значениями по умолчанию', () => {
    expect(readState('?class=hobbit&faction=neutral&mode=maybe')).toMatchObject({
      cls: 'rogue',
      faction: 'alliance',
      mode: 'now',
    })
  })

  it('уровень за границами ползунка не берёт', () => {
    expect(readState('?level=0').level).toBe(40)
    expect(readState('?level=61').level).toBe(40)
    expect(readState('?level=abc').level).toBe(40)
  })

  it('положение ползунка выносливости тоже проверяет', () => {
    expect(readState('?class=mage&stam=99').stam).toBe(1)
    expect(readState('?class=mage&stam=-1').stam).toBe(1)
  })
})

describe('stateToSearch', () => {
  it('складывает адрес обратно', () => {
    expect(
      stateToSearch(readState('?faction=horde&class=mage&level=25&stam=0&mode=long')),
    ).toBe('faction=horde&class=mage&level=25&stam=0&mode=long')
  })
})

describe('useUrlState', () => {
  beforeEach(() => {
    history.replaceState(null, '', '/?class=mage&level=30')
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('поднимает состояние из адреса', () => {
    const { result } = renderHook(() => useUrlState())

    expect(result.current[0]).toMatchObject({ cls: 'mage', level: 30 })
  })

  it('дописывает изменение в адрес, но не на каждый шаг ползунка', () => {
    const { result } = renderHook(() => useUrlState())

    act(() => result.current[1]({ level: 31 }))
    act(() => result.current[1]({ level: 32 }))
    expect(location.search).not.toContain('level=32')

    act(() => vi.runAllTimers())
    expect(location.search).toContain('level=32')
    expect(location.search).toContain('class=mage')
  })

  it('без адреса поднимает прошлый набор из хранилища', () => {
    const { result: first } = renderHook(() => useUrlState())
    act(() => first.current[1]({ cls: 'warrior', level: 55, mode: 'long' }))
    act(() => vi.runAllTimers())

    history.replaceState(null, '', '/')
    const { result: again } = renderHook(() => useUrlState())

    expect(again.current[0]).toMatchObject({ cls: 'warrior', level: 55, mode: 'long' })
  })

  it('в первый раз без адреса и хранилища берёт значения по умолчанию', () => {
    history.replaceState(null, '', '/')

    const { result } = renderHook(() => useUrlState())

    expect(result.current[0]).toEqual(readState(''))
  })

  it('адрес главнее хранилища - по ссылке видно её набор', () => {
    const { result: first } = renderHook(() => useUrlState())
    act(() => first.current[1]({ cls: 'warrior', level: 55 }))
    act(() => vi.runAllTimers())

    history.replaceState(null, '', '/?class=priest&level=12&faction=horde&stam=0&mode=now')
    const { result: shared } = renderHook(() => useUrlState())

    expect(shared.current[0]).toMatchObject({ cls: 'priest', level: 12 })
  })
})
