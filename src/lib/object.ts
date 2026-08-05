// Object.keys/entries теряют тип ключа. Наши словари описаны как
// Partial<Record<K, V>>, ключи там перечислимы - возвращаем их как есть,
// чтобы приведение типа лежало в одном месте, а не по всей логике.

export const keysOf = <K extends string>(record: Partial<Record<K, unknown>>): K[] =>
  Object.keys(record) as K[]

export const entriesOf = <K extends string, V>(record: Partial<Record<K, V>>): [K, V][] =>
  Object.entries(record) as [K, V][]
