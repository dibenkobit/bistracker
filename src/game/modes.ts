export type ModeId = 'now' | 'long'

export interface Mode {
  id: ModeId
  label: string
  hint: string
}

// два взгляда на один и тот же список: что лучше прямо сейчас и что стоит
// покупать - вещь, которая продержится дольше всех, редко бывает лучшей
export const MODES: readonly Mode[] = [
  { id: 'now', label: 'Сейчас', hint: 'Лучшее на этом уровне' },
  {
    id: 'long',
    label: 'Надолго',
    hint: 'Что дольше всех держится в пределах 10% от лучшего',
  },
]

export const isModeId = (value: unknown): value is ModeId => MODES.some((m) => m.id === value)
