import type { SlotId } from '@/data/schema'
import type { Side } from '@/game'
import { iconUrl, quality, SLOT_ICON, SLOTS } from '@/game'
import { fullName } from '@/lib/bis'
import { isLongVariant } from '@/lib/diff'
import { holdText, spanText } from '@/lib/text'

import { AltList } from './AltList'
import { EmptySlot } from './EmptySlot'
import type { GearView } from './gear'
import { Span } from './Span'
import { Tooltip } from './Tooltip'

interface GearRowProps {
  slot: SlotId
  side: Side
  view: GearView
}

/** Строка экипировки: кнопка, по щелчку под ней раскрываются замены на слот. */
export function GearRow({ slot, side, view }: GearRowProps) {
  const variants = view.bySlot[slot]
  const worn = variants?.[0]

  if (!worn || !variants)
    return (
      <EmptySlot name={SLOTS[slot]} icon={SLOT_ICON[slot]} note="нет варианта" side={side} />
    )

  const open = view.open === slot
  const fresh = view.changed.includes(slot)
  const q = quality(worn.item.q)
  const name = fullName(worn)

  return (
    <div className={`cell cell--${side}`}>
      <button
        className={`gear gear--${side} ${fresh ? 'is-new' : ''} ${open ? 'is-open' : ''}`}
        onClick={() => view.onToggle(slot)}
        aria-expanded={open}
        title={`${view.long ? 'Кто ещё держится' : 'Замены'} на слот: ${SLOTS[slot]}`}
      >
        <img
          className="gear__icon"
          style={{ borderColor: q.color }}
          src={iconUrl(worn.item.icon)}
          alt=""
          loading="lazy"
        />
        <div className="gear__text">
          <span className="gear__name" style={{ color: q.color }}>
            {name}
          </span>
          <span className="gear__meta">
            {fresh && <span className="gear__new">новое</span>}
            {/* статы этой вещи выпадают при создании - какой достанется, видно
                только в тултипе лота на аукционе */}
            {worn.low && <span className="gear__roll">ролл</span>}
            <span className="gear__till">
              {isLongVariant(worn) ? spanText(worn, view.level) : holdText(view.till[slot])}
            </span>
          </span>
          {isLongVariant(worn) && (
            <Span from={worn.from} to={worn.to} level={view.level} color={q.color} />
          )}
        </div>
        <Tooltip name={name} quality={q} item={worn.item} stats={worn.stats} low={worn.low} />
      </button>
      {open && <AltList variants={variants} side={side} long={view.long} level={view.level} />}
    </div>
  )
}
