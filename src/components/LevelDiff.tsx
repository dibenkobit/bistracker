import type { SlotId } from '@/data/schema'
import type { ModeId } from '@/game'
import { MIN_LEVEL } from '@/game'
import { slotList } from '@/lib/text'

interface LevelDiffProps {
  mode: ModeId
  level: number
  changed: readonly SlotId[]
}

/** Строка под ползунками: что поменялось на этом уровне или как читать полоски. */
export function LevelDiff({ mode, level, changed }: LevelDiffProps) {
  if (mode === 'long') {
    return (
      <p className="diff">
        Что взять на {level}, чтобы дольше не трогать слот. Полоска — уровни, где вещь остаётся
        в пределах 10% от лучшей, засечка — где ты сейчас.
      </p>
    )
  }

  if (level === MIN_LEVEL) return <p className="diff">Стартовый набор</p>

  return (
    <p className="diff">
      {changed.length > 0 ? (
        <>
          На {level} меняешь: <b>{slotList(changed)}</b>
        </>
      ) : (
        `На ${level} ничего не меняется`
      )}
    </p>
  )
}
