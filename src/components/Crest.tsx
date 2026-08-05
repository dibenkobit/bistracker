import type { CharacterClass } from '@/game'
import { iconUrl } from '@/game'

export function Crest({ cls }: { cls: CharacterClass }) {
  return <img className="crest" src={iconUrl(cls.icon)} alt={cls.name} />
}
