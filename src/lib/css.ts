import type { CSSProperties } from 'react'

/**
 * Цвет класса и задник фракции приезжают из данных и уходят в CSS-переменные.
 * React про кастомные свойства не знает - приведение типа держим в одном месте.
 */
export const cssVars = (vars: Record<`--${string}`, string>): CSSProperties =>
  vars as CSSProperties
