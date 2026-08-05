/**
 * Границы ползунка: с 1-го уровня до 60-го - потолка классического
 * TBC-контента в данных.
 */
export const MIN_LEVEL = 1
export const MAX_LEVEL = 60

/** Сколько уровней на шкале - по этому считается ширина клетки в полоске. */
export const LEVEL_COUNT = MAX_LEVEL + 1 - MIN_LEVEL
