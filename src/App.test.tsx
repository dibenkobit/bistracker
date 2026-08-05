import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { item, makeData, row } from '@/test/fixture'

import App from './App'

// два уровня и две вещи в груди: на 21 она меняется - этого хватает, чтобы
// проверить и «новое», и подписи про смену, и режим «надолго»
const data = makeData({
  items: {
    1: item({ name: 'Куртка ученика' }),
    2: item({ name: 'Куртка мастера' }),
    3: item({ name: 'Мантия мага' }),
  },
  rows: [
    row(1, { Agility: 5 }),
    row(2, { Agility: 9 }),
    row(3, { Intellect: 6 }, { sfx: 'of the Owl', low: { Intellect: 3 } }),
  ],
  lists: [
    [
      [0, 100],
      [1, 70],
    ],
    [[1, 100]],
    [[2, 100, 50, 100]],
  ],
  bis: {
    rogue: { 20: [{ chest: 0 }, {}, {}, {}], 21: [{ chest: 1 }, {}, {}, {}] },
    mage: { 20: [{ chest: 2 }, {}, {}, {}] },
  },
})

const setSearch = (search: string) => history.replaceState(null, '', `/?${search}`)

// названия видны и в строке слота, и в тултипе под ней - на кукле смотрим
// именно строки, иначе любая проверка спотыкается о два совпадения
const worn = () => [...document.querySelectorAll('.gear__name')].map((n) => n.textContent)

const slotButton = (slot: string) => screen.getByTitle(new RegExp(`на слот: ${slot}`, 'u'))

describe('App', () => {
  beforeEach(() => setSearch('class=rogue&level=20&stam=0&mode=now'))

  it('показывает надетое на выбранном уровне', () => {
    render(<App data={data} />)

    expect(screen.getByRole('heading', { name: 'Оружейная' })).toBeInTheDocument()
    expect(worn()).toContain('Куртка ученика')
  })

  it('на стартовом уровне сравнивать не с чем', () => {
    setSearch('class=rogue&level=1&stam=0&mode=now')
    render(<App data={data} />)

    expect(screen.getByText('Стартовый набор')).toBeInTheDocument()
  })

  it('на пустой слот ставит заглушку', () => {
    render(<App data={data} />)

    expect(screen.getAllByText('нет варианта').length).toBeGreaterThan(0)
  })

  it('на следующем уровне отмечает смену вещи', () => {
    setSearch('class=rogue&level=21&stam=0&mode=now')
    render(<App data={data} />)

    expect(worn()).toContain('Куртка мастера')
    expect(screen.getByText('новое')).toBeInTheDocument()
    expect(screen.getByText(/На 21 меняешь/u)).toBeInTheDocument()
  })

  it('по щелчку раскрывает замены и снова закрывает', async () => {
    const user = userEvent.setup()
    render(<App data={data} />)

    const slot = slotButton('Грудь')
    expect(slot).toHaveAttribute('aria-expanded', 'false')

    await user.click(slot)
    const alts = screen.getByText('Если этого нет на аукционе').parentElement!
    expect(within(alts).getByText('сейчас')).toBeInTheDocument()
    expect(within(alts).getByText('70%')).toBeInTheDocument()

    await user.click(slot)
    expect(screen.queryByText('Если этого нет на аукционе')).not.toBeInTheDocument()
  })

  it('в режиме «надолго» подписывает отрезок вместо процентов', () => {
    setSearch('class=rogue&level=20&stam=0&mode=long')
    render(<App data={data} />)

    expect(screen.getByText('до 20 · 1 ур.')).toBeInTheDocument()
    expect(screen.getByText(/Полоска — уровни/u)).toBeInTheDocument()
  })

  it('смена класса меняет список и закрывает раскрытый слот', async () => {
    const user = userEvent.setup()
    render(<App data={data} />)

    await user.click(slotButton('Грудь'))
    await user.click(screen.getByRole('button', { name: 'Маг' }))

    expect(screen.queryByText('Если этого нет на аукционе')).not.toBeInTheDocument()
    expect(worn()).toContain('Мантия мага of the Owl')
    expect(screen.getByText('ролл')).toBeInTheDocument()
  })

  it('роллящуюся вещь считает в сводке по середине вилки', () => {
    setSearch('class=mage&level=20&stam=0&mode=now')
    render(<App data={data} />)

    const summary = screen.getByText('Интеллект').parentElement!
    expect(within(summary).getByText('5')).toBeInTheDocument()
  })

  it('ползунок уровня переключает набор', () => {
    render(<App data={data} />)
    const slider = screen.getByLabelText('Уровень персонажа')

    expect(worn()).toContain('Куртка ученика')
    fireEvent.change(slider, { target: { value: '21' } })
    expect(worn()).toContain('Куртка мастера')
  })
})
