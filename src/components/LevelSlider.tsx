import { MAX_LEVEL, MIN_LEVEL } from '@/game'

interface LevelSliderProps {
  level: number
  onChange: (level: number) => void
}

export function LevelSlider({ level, onChange }: LevelSliderProps) {
  return (
    <div className="levelbar">
      <span className="levelbar__cap">Уровень</span>
      <input
        className="levelbar__slider"
        type="range"
        min={MIN_LEVEL}
        max={MAX_LEVEL}
        value={level}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Уровень персонажа"
      />
      <output className="levelbar__num">{level}</output>
    </div>
  )
}
