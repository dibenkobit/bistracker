import { useCallback, useEffect, useState } from 'react'

import type { ClassId, FactionId } from '@/data/schema'
import {
  isClassId,
  isFactionId,
  isModeId,
  isStaminaStep,
  MAX_LEVEL,
  MIN_LEVEL,
  SOLO_STEP,
  type ModeId,
} from '@/game'

/**
 * Всё, чем управляет пользователь. Живёт в адресе - ссылкой можно поделиться,
 * а копия лежит в localStorage, чтобы вернуться к своему набору без ссылки.
 */
export interface ViewState {
  faction: FactionId
  cls: ClassId
  level: number
  stam: number
  mode: ModeId
}

const DEFAULT_CLASS: ClassId = 'rogue'
const DEFAULT_FACTION: FactionId = 'alliance'
const DEFAULT_LEVEL = 40

/**
 * Пока тянешь ползунок, уровень меняется на каждый шаг, а браузеры
 * ограничивают частоту replaceState - поэтому адрес пишем с задержкой.
 */
const WRITE_DELAY_MS = 200

const STORAGE_KEY = 'armory:view'

/**
 * В хранилище лежит тот же самый набор параметров, что и в адресе: разбирает
 * его та же readState, поэтому чужому или устаревшему содержимому отдельная
 * проверка не нужна. Само хранилище бывает недоступно - в приватном режиме или
 * в песочнице обращение к нему кидает исключение, тогда просто не запоминаем.
 */
function loadSearch(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function saveSearch(search: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, search)
  } catch {
    // не запомнили - не беда, адрес всё равно на месте
  }
}

export function readState(search: string): ViewState {
  const params = new URLSearchParams(search)

  const rawClass = params.get('class')
  const cls = isClassId(rawClass) ? rawClass : DEFAULT_CLASS

  const rawFaction = params.get('faction')
  const rawMode = params.get('mode')
  const level = Math.round(Number(params.get('level')))

  // без параметра в адресе стоит совет для соло, а не чистый ДПС: пустой
  // params.get() дал бы ноль, поэтому смотрим именно на наличие
  const solo = SOLO_STEP[cls]
  const stam = params.has('stam') ? Math.round(Number(params.get('stam'))) : solo

  return {
    cls,
    faction: isFactionId(rawFaction) ? rawFaction : DEFAULT_FACTION,
    level: level >= MIN_LEVEL && level <= MAX_LEVEL ? level : DEFAULT_LEVEL,
    stam: isStaminaStep(stam) ? stam : solo,
    mode: isModeId(rawMode) ? rawMode : 'now',
  }
}

export const stateToSearch = ({ faction, cls, level, stam, mode }: ViewState): string =>
  String(
    new URLSearchParams({
      faction,
      class: cls,
      level: String(level),
      stam: String(stam),
      mode,
    }),
  )

/** Состояние вида и адрес - одно и то же: изменения уезжают в адрес с задержкой. */
export function useUrlState(): [ViewState, (patch: Partial<ViewState>) => void] {
  // адрес главнее: пришли по ссылке - показываем её набор, а не свой прошлый
  const [state, setState] = useState(() => readState(location.search || loadSearch()))

  const update = useCallback((patch: Partial<ViewState>) => {
    setState((prev) => ({ ...prev, ...patch }))
  }, [])

  useEffect(() => {
    const id = setTimeout(() => {
      const search = stateToSearch(state)
      history.replaceState(null, '', `?${search}`)
      saveSearch(search)
    }, WRITE_DELAY_MS)
    return () => clearTimeout(id)
  }, [state])

  return [state, update]
}
