/** Пока едет bis.json - он весит четыре мегабайта, на медленной сети это заметно. */
export function Loading() {
  return (
    <div className="boot" role="status">
      <p className="boot__title">Открываем оружейную</p>
      <p className="boot__hint">Считаем списки по уровням…</p>
    </div>
  )
}
