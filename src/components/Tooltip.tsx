import type { Item, Stats, Weapon } from '@/data/schema'
import { isWeapon } from '@/data/schema'
import type { Quality } from '@/game'
import { BASE_STATS, EQUIP_EFFECT, INV_TYPE, ITEM_SUBTYPE } from '@/game/tooltip'
import { entriesOf } from '@/lib/object'
import { statText } from '@/lib/text'

interface TooltipProps {
  name: string
  quality: Quality
  item: Item
  stats: Stats
  low?: Stats
}

/** Порядок строк, формулировки и цвета - как в игровом тултипе. */
export function Tooltip({ name, quality, item, stats, low }: TooltipProps) {
  const armor = stats.Armor ?? item.armor

  return (
    <div className="tip" role="tooltip">
      <p className="tip__name" style={{ color: quality.color }}>
        {name}
      </p>
      <p>Уровень предмета: {item.ilvl}</p>
      {item.boe && <p>Становится персональным при надевании</p>}
      {item.uniq && <p>Уникальный</p>}

      <p className="tip__row">
        <span>{INV_TYPE[item.inv]}</span>
        <span>{ITEM_SUBTYPE[`${item.cls}.${item.sub}`]}</span>
      </p>

      {isWeapon(item) && <DamageLines item={item} />}
      {armor !== undefined && armor > 0 && <p>Броня: {Math.round(armor)}</p>}

      <BaseStats stats={stats} low={low} />

      {item.dura && (
        <p>
          Прочность: {item.dura} / {item.dura}
        </p>
      )}
      <p>Требуется {item.lvl}-й ур.</p>

      <EquipEffects stats={stats} low={low} />

      {low && (
        <p className="tip__roll">
          Статы выпадают при создании вещи — на аукционе смотри, что за ролл
        </p>
      )}
    </div>
  )
}

function DamageLines({ item }: { item: Weapon }) {
  const dps = ((item.dmin + item.dmax) / 2 / item.speed).toFixed(2)

  return (
    <>
      <p className="tip__row">
        <span>
          Урон: {item.dmin}-{item.dmax}
        </span>
        <span>Скорость {item.speed.toFixed(2)}</span>
      </p>
      <p>({dps} ед. урона в секунду)</p>
    </>
  )
}

/** Базовые характеристики - белой строкой «+N к силе». */
function BaseStats({ stats, low }: { stats: Stats; low?: Stats }) {
  return entriesOf(BASE_STATS).map(([key, word]) =>
    stats[key] ? (
      <p key={key}>
        +{statText(stats, low, key)} к {word}
      </p>
    ) : null,
  )
}

/** Остальное - зелёной строкой «Если на персонаже: ...». */
function EquipEffects({ stats, low }: { stats: Stats; low?: Stats }) {
  return entriesOf(stats).map(([key]) => {
    const effect = EQUIP_EFFECT[key]
    return effect ? (
      <p className="tip__equip" key={key}>
        Если на персонаже: {effect(statText(stats, low, key))}
      </p>
    ) : null
  })
}
