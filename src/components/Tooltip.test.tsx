import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { QUALITY } from '@/game'
import { item } from '@/test/fixture'

import { Tooltip } from './Tooltip'

type Props = Parameters<typeof Tooltip>[0]

const show = (props: Partial<Props> = {}) =>
  render(
    <Tooltip {...{ name: 'Вещь', quality: QUALITY[2], item: item(), stats: {}, ...props }} />,
  )

describe('Tooltip', () => {
  it('у оружия считает урон в секунду', () => {
    show({ item: item({ dmin: 10, dmax: 20, speed: 2 }) })

    expect(screen.getByText('Урон: 10-20')).toBeInTheDocument()
    expect(screen.getByText('Скорость 2.00')).toBeInTheDocument()
    expect(screen.getByText('(7.50 ед. урона в секунду)')).toBeInTheDocument()
  })

  it('у брони строки урона нет', () => {
    show({ item: item({ armor: 42 }) })

    expect(screen.queryByText(/урона в секунду/u)).not.toBeInTheDocument()
    expect(screen.getByText('Броня: 42')).toBeInTheDocument()
  })

  it('базовые статы пишет «+N к ...», остальное - зелёной строкой', () => {
    show({ stats: { Agility: 7, AttackPower: 14 } })

    expect(screen.getByText('+7 к ловкости')).toBeInTheDocument()
    expect(screen.getByText(/Повышает силу атаки на 14/u)).toBeInTheDocument()
  })

  it('роллящийся стат пишет вилкой и предупреждает про ролл', () => {
    show({ stats: { Agility: 4 }, low: { Agility: 2 } })

    expect(screen.getByText('+2-4 к ловкости')).toBeInTheDocument()
    expect(screen.getByText(/Статы выпадают при создании вещи/u)).toBeInTheDocument()
  })

  it('переводит слот и тип предмета так же, как игра', () => {
    show({ item: item({ inv: 13, cls: 2, sub: 15 }) })

    expect(screen.getByText('Одноручное')).toBeInTheDocument()
    expect(screen.getByText('Кинжал')).toBeInTheDocument()
  })
})
