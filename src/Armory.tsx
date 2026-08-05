import { use } from 'react'

import App from '@/App'
import { loadBisData } from '@/data/load'

/**
 * Ждём данные и отдаём их приложению. Дальше App - чистая функция от них:
 * ни сети, ни глобального состояния внутри, поэтому его легко и рисовать
 * в тестах, и читать.
 */
export default function Armory() {
  return <App data={use(loadBisData())} />
}
