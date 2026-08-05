// bis.json подключён как ассет (`?url`): Vite кладёт его отдельным файлом с
// хешем в имени, и браузер тянет его параллельно. Прямой импорт запёк бы 4 МБ
// JSON прямо в бандл - страница ждала бы разбора всего файла как JavaScript.
import bisUrl from './bis.json?url'
import type { BisData } from './schema'

let pending: Promise<BisData> | undefined

/**
 * Данные статичны, поэтому запрос уходит один раз на всё время жизни страницы,
 * а промис переиспользуется - его ждёт `use()` внутри Suspense.
 */
export function loadBisData(): Promise<BisData> {
  pending ??= fetch(bisUrl).then((response) => {
    if (!response.ok) {
      throw new Error(`не удалось загрузить данные: HTTP ${response.status}`)
    }
    return response.json() as Promise<BisData>
  })
  return pending
}
