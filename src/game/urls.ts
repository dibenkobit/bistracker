const FALLBACK_ICON = 'inv_misc_questionmark'

export const wowheadUrl = (id: number): string => `https://www.wowhead.com/tbc/item=${id}`

/** Иконки лежат на CDN Wowhead под тем же именем, что в данных клиента. */
export const iconUrl = (icon: string | undefined): string =>
  `https://wow.zamimg.com/images/wow/icons/large/${icon ?? FALLBACK_ICON}.jpg`
