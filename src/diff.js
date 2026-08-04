// Что меняется при переходе на уровень выше. Списки уже посчитаны на каждый
// уровень, разница между соседними - это и есть план прокачки.

// вещь та же самая, если совпали предмет и суффикс
const key = (row) => (row ? `${row.item}:${row.sfx ?? ''}` : null)

// в слоте лежит список вариантов, первый - лучший; сравниваем именно его
const worn = (slots, slot) => (slots ?? {})[slot]?.[0]

// слоты, которые меняются при переходе prev -> next. Пропавшие слоты не
// перечисляем: замена всплывает сама - когда двуручное меняется на пару
// одноручных, в списке оказываются правая и левая рука
export function changedSlots(prev, next) {
  return Object.keys(next ?? {}).filter(
    (slot) => key(worn(prev, slot)) !== key(worn(next, slot)),
  )
}

// вещь считаем годной, пока от лучшей на этом уровне остаётся хотя бы столько
const NEAR = 90

// подряд идущие уровни в отрезки: [10,11,12,15,16] -> [[10,12],[15,16]]
const runs = (lvls) =>
  lvls.reduce((acc, lvl) => {
    const last = acc.at(-1)
    if (last && lvl === last[1] + 1) last[1] = lvl
    else acc.push([lvl, lvl])
    return acc
  }, [])

// что взять в слот, чтобы подольше не трогать: у каждой вещи берём отрезок
// уровней, где она держится в пределах 10% от лучшей, и меряем, сколько от
// него осталось с нашего уровня. Вещь на вырост сюда тоже попадает - её
// отрезок просто начинается позже, и это видно по полоске
export function longLived(levels, slot, level, minLevel, maxLevel) {
  const seen = new Map()
  for (let lvl = minLevel; lvl <= maxLevel; lvl++) {
    for (const entry of (levels[lvl] ?? {})[slot] ?? []) {
      if (entry.pct < NEAR) continue
      const k = key(entry)
      if (!seen.has(k)) seen.set(k, { entry, lvls: [] })
      seen.get(k).lvls.push(lvl)
    }
  }

  const life = ([from, to]) => to - Math.max(from, level) + 1
  const out = []
  for (const { entry, lvls } of seen.values()) {
    // отрезков бывает несколько - вещь может просесть и снова всплыть. Кончившиеся
    // не в счёт, из оставшихся берём тот, что даст больше уровней
    const span = runs(lvls)
      .filter(([, to]) => to >= level)
      .sort((a, b) => life(b) - life(a))[0]
    if (span) out.push({ ...entry, from: span[0], to: span[1], life: life(span) })
  }
  // при равной жизни вперёд ту, что уже можно надеть
  return out.sort((a, b) => b.life - a.life || a.from - b.from)
}

// до какого уровня каждая вещь остаётся лучшей: slot -> уровень. Это и есть
// ответ на «стоит ли брать» - списки тут меняются почти каждый уровень, и
// общего «следующая замена» не существует, а по слотам разброс большой
export function holdsUntil(levels, level, maxLevel) {
  const till = {}
  for (const slot of Object.keys(levels[level] ?? {})) {
    const now = key(worn(levels[level], slot))
    let lvl = level
    while (lvl < maxLevel && key(worn(levels[lvl + 1], slot)) === now) lvl++
    till[slot] = lvl
  }
  return till
}
