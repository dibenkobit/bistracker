import type { Side } from '@/game'
import { iconUrl } from '@/game'

interface EmptySlotProps {
  name: string
  /** заглушка пустого слота - та же текстура, что в самой игре */
  icon: string
  /** почему слот пуст; у рубашки с накидкой объяснять нечего */
  note?: string
  side: Side
}

/** Слот без вещи: иконка-заглушка и название слота вместо предмета. */
export function EmptySlot({ name, icon, note, side }: EmptySlotProps) {
  return (
    <div className={`gear gear--${side} gear--empty`}>
      <img className="gear__icon gear__icon--empty" src={iconUrl(icon)} alt="" />
      <div className="gear__text">
        <span className="gear__slot">{name}</span>
        {note && <span className="gear__none">{note}</span>}
      </div>
    </div>
  )
}
