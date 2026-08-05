import { useEffect, useMemo, useState } from 'react'

import data from './data/bis.json'
import { changedSlots, holdsUntil, longLived } from './diff'
import {
  CLASSES,
  FACTIONS,
  QUALITY,
  SLOTS,
  SLOT_ICON,
  LEFT_COLUMN,
  RIGHT_COLUMN,
  WEAPON_ROW,
  STAT_NAMES,
  SUMMARY_STATS,
  INV_TYPE,
  ITEM_SUBTYPE,
  BASE_STATS,
  EQUIP_EFFECT,
  STAMINA_STEPS,
  SOLO_STEP,
  SOLO_WHY,
  MODES,
  wowheadUrl,
  iconUrl,
} from './game'

import './App.css'

const MIN_LEVEL = 10
const MAX_LEVEL = 60

// класс, уровень, фракция и вес выносливости живут в адресе - ссылкой на
// список можно поделиться
function readUrl() {
  const p = new URLSearchParams(location.search)
  const level = Math.round(Number(p.get('level')))
  const cls = CLASSES.some((c) => c.id === p.get('class')) ? p.get('class') : 'rogue'
  // без параметра в адресе стоит совет для соло, а не чистый ДПС: пустой
  // p.get() дал бы ноль, поэтому смотрим именно на наличие
  const stam = p.has('stam') ? Math.round(Number(p.get('stam'))) : SOLO_STEP[cls]
  return {
    cls,
    faction: FACTIONS.some((f) => f.id === p.get('faction')) ? p.get('faction') : 'alliance',
    level: level >= MIN_LEVEL && level <= MAX_LEVEL ? level : 40,
    stam: stam >= 0 && stam < STAMINA_STEPS.length ? stam : SOLO_STEP[cls],
    mode: MODES.some((m) => m.id === p.get('mode')) ? p.get('mode') : 'now',
  }
}

const START = readUrl()

// в предложении названия слотов идут строчными, кольца не дублируются
const slotList = (slots) =>
  [...new Set(slots.map((slot) => SLOTS[slot].toLowerCase()))].join(', ')

function Crest({ cls }) {
  return <img className="crest" src={iconUrl(cls.icon)} alt={cls.name} />
}

// у роллящейся вещи стат пишется вилкой: «+3-4 к ловкости». low - самый бедный
// ролл, stats - самый богатый, между ними и лежит то, что достанется
const statText = (stats, low, key) => {
  const high = Math.round(stats[key])
  const min = Math.round(low?.[key] ?? stats[key])
  return min === high ? `${high}` : `${min}-${high}`
}

// порядок строк, формулировки и цвета - как в игровом тултипе
function Tooltip({ name, quality, item, stats, low }) {
  const armor = stats.Armor ?? item.armor
  const dps = item.speed && ((item.dmin + item.dmax) / 2 / item.speed).toFixed(2)
  const subtype = ITEM_SUBTYPE[`${item.cls}.${item.sub}`]

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
        <span>{subtype}</span>
      </p>

      {dps && (
        <>
          <p className="tip__row">
            <span>
              Урон: {item.dmin}-{item.dmax}
            </span>
            <span>Скорость {item.speed.toFixed(2)}</span>
          </p>
          <p>({dps} ед. урона в секунду)</p>
        </>
      )}
      {armor > 0 && <p>Броня: {Math.round(armor)}</p>}

      {Object.entries(BASE_STATS).map(([key, word]) =>
        stats[key] ? (
          <p key={key}>
            +{statText(stats, low, key)} к {word}
          </p>
        ) : null,
      )}

      {item.dura && (
        <p>
          Прочность: {item.dura} / {item.dura}
        </p>
      )}
      <p>Требуется {item.lvl}-й ур.</p>

      {Object.entries(stats).map(([key]) => {
        const effect = EQUIP_EFFECT[key]
        return effect ? (
          <p className="tip__equip" key={key}>
            Если на персонаже: {effect(statText(stats, low, key))}
          </p>
        ) : null
      })}

      {low && (
        <p className="tip__roll">
          Статы выпадают при создании вещи — на аукционе смотри, что за ролл
        </p>
      )}
    </div>
  )
}

// вещи тут живут по-разному: одна до 44, другую меняешь на следующем уровне.
// till - последний уровень, где вещь ещё лучшая, а называем всегда уровень
// замены: иначе на самом till текст менялся бы с «до 22» на «сменится на 23»
// и выглядел бы как расхождение. На потолке говорить нечего - дальше уровней нет
const holdText = (till) => (till < MAX_LEVEL ? `сменится на ${till + 1}` : '')

// ---- «надолго»: сколько вещь продержится ----

// каждый уровень занимает на шкале свою клетку, поэтому конец отрезка считаем
// по следующему за ним уровню - иначе вещь на один уровень была бы шириной в ноль
const CELL = 100 / (MAX_LEVEL + 1 - MIN_LEVEL)
const pos = (lvl) => (lvl - MIN_LEVEL) * CELL

// «до 41 · 18 ур.», а вещи на вырост - ещё и с какого уровня её носить.
// Сокращаем «ур.» из-за склонения: было бы «21 уровень», но «18 уровней»
const spanText = ({ from, to, life }, level) =>
  (from > level ? `с ${from} ` : '') +
  (to >= MAX_LEVEL ? 'до конца' : `до ${to}`) +
  ` · ${life} ур.`

// отрезок уровней, на которых вещь держится: сразу видно, когда её покупать,
// когда менять и насколько она перекрывает соседние варианты
function Span({ from, to, level, color }) {
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

// название вместе со случайным суффиксом: «Green Silk Armor of the Tiger»
const fullName = (item, entry) => (entry.sfx ? `${item.name} ${entry.sfx}` : item.name)

// на аукционе лучшей вещи может не оказаться - тогда нужен ответ «что вместо».
// список открывается по щелчку и начинается с самой вещи, чтобы было с чем
// сравнивать: рядом с каждой заменой написано, сколько от неё остаётся
function AltList({ variants, side, long, level }) {
  return (
    <div className={`alts alts--${side} ${long ? 'alts--long' : ''}`}>
      <p className="alts__cap">
        {long ? 'Кто ещё держится подолгу' : 'Если этого нет на аукционе'}
      </p>
      <ul>
        {variants.map((entry, n) => {
          const item = data.items[entry.item]
          const quality = QUALITY[item.q] ?? QUALITY[2]
          const name = fullName(item, entry)
          return (
            <li key={`${entry.item}:${entry.sfx ?? ''}`}>
              <a
                className={`alt ${n === 0 ? 'is-worn' : ''}`}
                href={wowheadUrl(entry.item)}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  className="alt__icon"
                  style={{ borderColor: quality.color }}
                  src={iconUrl(item.icon)}
                  alt=""
                  loading="lazy"
                />
                <span className="alt__text">
                  <span className="alt__name" style={{ color: quality.color }}>
                    {name}
                  </span>
                  {/* вилка бывает и по статам, которые классу не нужны - тогда
                      очки от ролла не зависят и показывать нечего */}
                  {entry.lo && (
                    <span className="alt__roll">
                      ролл {entry.lo}-{entry.hi}%
                    </span>
                  )}
                  {/* полоски стоят друг под другом и читаются как план покупок:
                      где кончается одна вещь, там начинается следующая */}
                  {long && (
                    <Span from={entry.from} to={entry.to} level={level} color={quality.color} />
                  )}
                </span>
                <span className="alt__pct">
                  {long ? spanText(entry, level) : n === 0 ? 'сейчас' : `${entry.pct}%`}
                </span>
                <Tooltip
                  name={name}
                  quality={quality}
                  item={item}
                  stats={entry.stats}
                  low={entry.low}
                />
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function GearRow({ slot, variants, side, fresh, till, long, level, open, onToggle }) {
  const entry = variants?.[0]
  if (!entry) {
    return (
      <div className={`gear gear--${side} gear--empty`}>
        <img className="gear__icon gear__icon--empty" src={iconUrl(SLOT_ICON[slot])} alt="" />
        <div className="gear__text">
          <span className="gear__slot">{SLOTS[slot]}</span>
          <span className="gear__none">нет варианта</span>
        </div>
      </div>
    )
  }

  const item = data.items[entry.item]
  const quality = QUALITY[item.q] ?? QUALITY[2]
  const name = fullName(item, entry)

  return (
    <div className={`cell cell--${side}`}>
      <button
        className={`gear gear--${side} ${fresh ? 'is-new' : ''} ${open ? 'is-open' : ''}`}
        onClick={onToggle}
        aria-expanded={open}
        title={`${long ? 'Кто ещё держится' : 'Замены'} на слот: ${SLOTS[slot]}`}
      >
        <img
          className="gear__icon"
          style={{ borderColor: quality.color }}
          src={iconUrl(item.icon)}
          alt=""
          loading="lazy"
        />
        <div className="gear__text">
          <span className="gear__name" style={{ color: quality.color }}>
            {name}
          </span>
          <span className="gear__meta">
            {fresh && <span className="gear__new">новое</span>}
            {/* статы этой вещи выпадают при создании - какой достанется, видно
                только в тултипе лота на аукционе */}
            {entry.low && <span className="gear__roll">ролл</span>}
            <span className="gear__till">{long ? spanText(entry, level) : holdText(till)}</span>
          </span>
          {long && <Span from={entry.from} to={entry.to} level={level} color={quality.color} />}
        </div>
        <Tooltip
          name={name}
          quality={quality}
          item={item}
          stats={entry.stats}
          low={entry.low}
        />
      </button>
      {open && <AltList variants={variants} side={side} long={long} level={level} />}
    </div>
  )
}

// что поменялось при переходе с прошлого уровня - «на 28 меняешь грудь и сапоги»
function LevelDiff({ level, changed }) {
  return (
    <p className="diff">
      {level === MIN_LEVEL ? (
        'Стартовый набор'
      ) : changed.length ? (
        <>
          На {level} меняешь: <b>{slotList(changed)}</b>
        </>
      ) : (
        `На ${level} ничего не меняется`
      )}
    </p>
  )
}

export default function App() {
  const [cls, setCls] = useState(START.cls)
  const [level, setLevel] = useState(START.level)
  const [faction, setFaction] = useState(START.faction)
  const [stam, setStam] = useState(START.stam)
  const [mode, setMode] = useState(START.mode)
  // слот с раскрытым списком замен; открыт всегда не больше одного
  const [open, setOpen] = useState(null)

  // адрес пишем с задержкой: пока тянешь ползунок, уровень меняется на каждый
  // шаг, а браузеры ограничивают частоту replaceState
  useEffect(() => {
    const id = setTimeout(() => {
      const p = new URLSearchParams({ faction, class: cls, level, stam, mode })
      history.replaceState(null, '', `?${p}`)
    }, 200)
    return () => clearTimeout(id)
  }, [faction, cls, level, stam, mode])

  // на каждое положение ползунка в данных лежат свои списки. И строки, и сами
  // списки повторяются на разных уровнях, поэтому хранятся по одному разу, а
  // уровень ссылается на них номерами - разворачиваем
  const levels = useMemo(() => {
    const src = data.bis[faction]?.[cls] ?? {}
    return Object.fromEntries(
      Object.entries(src).map(([lvl, steps]) => [
        lvl,
        Object.fromEntries(
          Object.entries(steps[stam]).map(([slot, id]) => [
            slot,
            // у роллящейся вещи после среднего идут границы: сколько дают самый
            // бедный и самый богатый ролл
            data.lists[id].map(([row, pct, lo, hi]) => ({ ...data.rows[row], pct, lo, hi })),
          ]),
        ),
      ]),
    )
  }, [faction, cls, stam])
  // тот же список, но отсортированный не по силе на уровне, а по тому, сколько
  // вещь ещё продержится. Слот может открыться позже нашего уровня - шлемов до
  // 24 в игре нет, - поэтому собираем слоты со всех уровней сверху
  const long = useMemo(() => {
    if (mode !== 'long') return null
    const slots = new Set()
    for (let lvl = level; lvl <= MAX_LEVEL; lvl++) {
      for (const slot of Object.keys(levels[lvl] ?? {})) slots.add(slot)
    }
    return Object.fromEntries(
      [...slots].map((slot) => [
        slot,
        longLived(levels, slot, level, MIN_LEVEL, MAX_LEVEL).slice(0, 11),
      ]),
    )
  }, [levels, level, mode])

  const bySlot = (mode === 'long' ? long : levels[level]) ?? {}
  const solo = SOLO_STEP[cls]
  const active = CLASSES.find((c) => c.id === cls)
  const side = FACTIONS.find((f) => f.id === faction)

  // на минимальном уровне сравнивать не с чем - там новое всё. В режиме
  // «надолго» вещи и не должны меняться с уровнем, сравнивать нечего
  const changed =
    mode === 'now' && level > MIN_LEVEL ? changedSlots(levels[level - 1], bySlot) : []
  const till = holdsUntil(levels, level, MAX_LEVEL)

  // роллящаяся вещь даёт не фиксированное число, а вилку - в сумме считаем её
  // серединой, иначе итог был бы по одному везучему роллу на каждый слот
  const totals = {}
  for (const variants of Object.values(bySlot)) {
    const { stats, low } = variants[0]
    for (const [key, value] of Object.entries(stats)) {
      totals[key] = (totals[key] ?? 0) + (value + (low?.[key] ?? value)) / 2
    }
  }

  const weapons = WEAPON_ROW.filter((slot) => bySlot[slot]?.length)

  return (
    <div
      className="armory"
      style={{ '--class-color': active.color, '--room': `url(${side.room})` }}
    >
      <div className="armory__scene" aria-hidden="true" />

      <header className="masthead">
        <Crest cls={active} />
        <div>
          <h1>Оружейная</h1>
          <p className="masthead__sub">
            {level} уровень · <span style={{ color: active.color }}>{active.name}</span> ·{' '}
            <span style={{ color: side.color }}>{side.name}</span>
          </p>
        </div>

        {/* один и тот же список, два вопроса: что надеть сейчас и что покупать */}
        <div className="modes" role="group" aria-label="Что показывать">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`mode ${m.id === mode ? 'is-active' : ''}`}
              onClick={() => (setMode(m.id), setOpen(null))}
              title={m.hint}
            >
              {m.label}
            </button>
          ))}
        </div>
      </header>

      <div className="levelbar">
        <span className="levelbar__cap">Уровень</span>
        <input
          className="levelbar__slider"
          type="range"
          min={MIN_LEVEL}
          max={MAX_LEVEL}
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          aria-label="Уровень персонажа"
        />
        <output className="levelbar__num">{level}</output>
      </div>

      <div className="stambar">
        <div className="levelbar levelbar--stam" title={STAMINA_STEPS[stam].hint}>
          <span className="levelbar__cap">Выносливость</span>
          <input
            className="levelbar__slider"
            type="range"
            min={0}
            max={STAMINA_STEPS.length - 1}
            value={stam}
            onChange={(e) => setStam(Number(e.target.value))}
            aria-label="Сколько стоит выносливость"
          />
          <output className="levelbar__num levelbar__num--word">
            {STAMINA_STEPS[stam].label}
          </output>
        </div>
        <p className="stambar__hint">
          {stam === solo ? (
            <>
              Столько советую, если качаешься <b>один</b>: {SOLO_WHY[solo]}
            </>
          ) : (
            <>
              {STAMINA_STEPS[stam].hint}. Качаешься один?{' '}
              <button className="stambar__link" onClick={() => setStam(solo)}>
                поставь «{STAMINA_STEPS[solo].label}»
              </button>
            </>
          )}
        </p>
      </div>

      {mode === 'now' ? (
        <LevelDiff level={level} changed={changed} />
      ) : (
        <p className="diff">
          Что взять на {level}, чтобы дольше не трогать слот. Полоска — уровни, где вещь
          остаётся в пределах 10% от лучшей, засечка — где ты сейчас.
        </p>
      )}

      <main className="doll">
        {/* сюда постепенно переезжают все настройки */}
        <aside className="panel">
          <section className="panel__group">
            <h3 className="panel__title">Фракция</h3>
            <div className="panel__row">
              {FACTIONS.map((f) => (
                <button
                  key={f.id}
                  className={`pick ${f.id === faction ? 'is-active' : ''}`}
                  style={{ '--pick-color': f.color }}
                  onClick={() => (setFaction(f.id), setOpen(null))}
                  title={`Список для стороны: ${f.name}`}
                >
                  <img src={f.crest} alt={f.name} />
                  <span className="pick__label">{f.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel__group">
            <h3 className="panel__title">Класс</h3>
            <div className="panel__row panel__row--grid">
              {CLASSES.map((c) => (
                <button
                  key={c.id}
                  className={`pick ${c.id === cls ? 'is-active' : ''}`}
                  style={{ '--pick-color': c.color }}
                  onClick={() => (setCls(c.id), setOpen(null))}
                  title={c.name}
                >
                  <img src={iconUrl(c.icon)} alt={c.name} />
                  <span className="pick__label">{c.name}</span>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <div className="doll__col">
          {LEFT_COLUMN.map((slot) => (
            <GearRow
              key={slot}
              slot={slot}
              variants={bySlot[slot]}
              side="left"
              fresh={changed.includes(slot)}
              till={till[slot]}
              long={mode === 'long'}
              level={level}
              open={open === slot}
              onToggle={() => setOpen(open === slot ? null : slot)}
            />
          ))}
        </div>

        <div className="doll__stage">
          <Crest cls={active} />
          <h2 className="stage__title">Итого</h2>
          <dl className="stage__stats">
            {SUMMARY_STATS.filter((key) => totals[key]).map((key) => (
              <div key={key}>
                <dt>{STAT_NAMES[key] ?? key}</dt>
                <dd>{Math.round(totals[key])}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="doll__col doll__col--right">
          {RIGHT_COLUMN.map((slot) => (
            <GearRow
              key={slot}
              slot={slot}
              variants={bySlot[slot]}
              side="right"
              fresh={changed.includes(slot)}
              till={till[slot]}
              long={mode === 'long'}
              level={level}
              open={open === slot}
              onToggle={() => setOpen(open === slot ? null : slot)}
            />
          ))}
        </div>
      </main>

      <section className="doll__weapons">
        {weapons.map((slot) => (
          <GearRow
            key={slot}
            slot={slot}
            variants={bySlot[slot]}
            side="left"
            fresh={changed.includes(slot)}
            till={till[slot]}
            long={mode === 'long'}
            level={level}
            open={open === slot}
            onToggle={() => setOpen(open === slot ? null : slot)}
          />
        ))}
      </section>

      <footer className="footer">
        Только BOE, без профессий · данные клиента TBC Anniversary · иконки Wowhead · оценка по
        ДПС{stam ? ' с поправкой на выживание' : ''}
      </footer>
    </div>
  )
}
