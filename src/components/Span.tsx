import { LEVEL_COUNT, MIN_LEVEL } from '@/game'

// каждый уровень занимает на шкале свою клетку, поэтому конец отрезка считаем
// по следующему за ним уровню - иначе вещь на один уровень была бы шириной в ноль
const CELL = 100 / LEVEL_COUNT
const pos = (level: number) => (level - MIN_LEVEL) * CELL

interface SpanProps {
  from: number
  to: number
  level: number
  color: string
}

/**
 * Отрезок уровней, на которых вещь держится: сразу видно, когда её покупать,
 * когда менять и насколько она перекрывает соседние варианты.
 */
export function Span({ from, to, level, color }: SpanProps) {
  return (
    <span className="span" aria-hidden="true">
      <span
        className="span__fill"
        style={{
          left: `${pos(from)}%`,
          width: `${pos(to + 1) - pos(from)}%`,
          background: color,
        }}
      />
      <span className="span__now" style={{ left: `${pos(level) + CELL / 2}%` }} />
    </span>
  )
}
