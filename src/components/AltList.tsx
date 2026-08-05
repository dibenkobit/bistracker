import type { Side } from '@/game'
import { iconUrl, quality, wowheadUrl } from '@/game'
import type { Variant } from '@/lib/bis'
import { fullName } from '@/lib/bis'
import { isLongVariant } from '@/lib/diff'
import { spanText } from '@/lib/text'

import { Span } from './Span'
import { Tooltip } from './Tooltip'

interface AltListProps {
  variants: readonly Variant[]
  side: Side
  long: boolean
  level: number
}

/**
 * На аукционе лучшей вещи может не оказаться - тогда нужен ответ «что вместо».
 * Список открывается по щелчку и начинается с самой вещи, чтобы было с чем
 * сравнивать: рядом с каждой заменой написано, сколько от неё остаётся.
 */
export function AltList({ variants, side, long, level }: AltListProps) {
  return (
    <div className={`alts alts--${side} ${long ? 'alts--long' : ''}`}>
      <p className="alts__cap">
        {long ? 'Кто ещё держится подолгу' : 'Если этого нет на аукционе'}
      </p>
      <ul>
        {variants.map((variant, index) => (
          <li key={`${variant.id}:${variant.sfx ?? ''}`}>
            <Alt variant={variant} worn={index === 0} level={level} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function Alt({ variant, worn, level }: { variant: Variant; worn: boolean; level: number }) {
  const q = quality(variant.item.q)
  const name = fullName(variant)
  const long = isLongVariant(variant)

  return (
    <a
      className={`alt ${worn ? 'is-worn' : ''}`}
      href={wowheadUrl(variant.id)}
      target="_blank"
      rel="noreferrer"
    >
      <img
        className="alt__icon"
        style={{ borderColor: q.color }}
        src={iconUrl(variant.item.icon)}
        alt=""
        loading="lazy"
      />
      <span className="alt__text">
        <span className="alt__name" style={{ color: q.color }}>
          {name}
        </span>
        {/* вилка бывает и по статам, которые классу не нужны - тогда очки от
            ролла не зависят и показывать нечего */}
        {variant.lo !== undefined && (
          <span className="alt__roll">
            ролл {variant.lo}-{variant.hi}%
          </span>
        )}
        {/* полоски стоят друг под другом и читаются как план покупок: где
            кончается одна вещь, там начинается следующая */}
        {long && <Span from={variant.from} to={variant.to} level={level} color={q.color} />}
      </span>
      <span className="alt__pct">
        {long ? spanText(variant, level) : worn ? 'сейчас' : `${variant.pct}%`}
      </span>
      <Tooltip
        name={name}
        quality={q}
        item={variant.item}
        stats={variant.stats}
        low={variant.low}
      />
    </a>
  )
}
