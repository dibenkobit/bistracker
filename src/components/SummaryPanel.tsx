import type { Stats } from '@/data/schema'
import type { CharacterClass } from '@/game'
import { STAT_NAMES, SUMMARY_STATS } from '@/game'

import { Crest } from './Crest'

export function SummaryPanel({ cls, totals }: { cls: CharacterClass; totals: Stats }) {
  return (
    <div className="doll__stage">
      <Crest cls={cls} />
      <h2 className="stage__title">Итого</h2>
      <dl className="stage__stats">
        {SUMMARY_STATS.filter((key) => totals[key]).map((key) => (
          <div key={key}>
            <dt>{STAT_NAMES[key]}</dt>
            <dd>{Math.round(totals[key] ?? 0)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
