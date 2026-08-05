import type { ClassId } from '@/data/schema'
import { SOLO_STEP, SOLO_WHY, STAMINA_STEPS } from '@/game'

interface StaminaSliderProps {
  cls: ClassId
  stam: number
  onChange: (stam: number) => void
}

/**
 * Ползунок не про уровень, а про вкус: сколько весит выносливость в долях
 * главного стата. Под ним подсказка - что стоит выбрать качающемуся в одиночку.
 */
export function StaminaSlider({ cls, stam, onChange }: StaminaSliderProps) {
  const solo = SOLO_STEP[cls]
  const step = STAMINA_STEPS[stam] ?? STAMINA_STEPS[0]!

  return (
    <div className="stambar">
      <div className="levelbar levelbar--stam" title={step.hint}>
        <span className="levelbar__cap">Выносливость</span>
        <input
          className="levelbar__slider"
          type="range"
          min={0}
          max={STAMINA_STEPS.length - 1}
          value={stam}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label="Сколько стоит выносливость"
        />
        <output className="levelbar__num levelbar__num--word">{step.label}</output>
      </div>
      <p className="stambar__hint">
        {stam === solo ? (
          <>
            Столько советую, если качаешься <b>один</b>: {SOLO_WHY[solo]}
          </>
        ) : (
          <>
            {step.hint}. Качаешься один?{' '}
            <button className="stambar__link" onClick={() => onChange(solo)}>
              поставь «{STAMINA_STEPS[solo]?.label}»
            </button>
          </>
        )}
      </p>
    </div>
  )
}
