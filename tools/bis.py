"""BiS по BOE-предметам для класса и уровня. Учитывает случайные суффиксы."""
import sqlite3, sys, csv, collections

con = sqlite3.connect('cmangos/tbcmangos.sqlite')
con.row_factory = sqlite3.Row
q = lambda s, *a: con.execute(s, a).fetchall()

# ---------- правила игры (в данных их нет, пишем руками) ----------
CLASS_ID = {'warrior': 1, 'paladin': 2, 'hunter': 3, 'rogue': 4, 'priest': 5,
            'shaman': 7, 'mage': 8, 'warlock': 9, 'druid': 11}

ARMOR = {  # 1=ткань 2=кожа 3=кольчуга 4=латы 6=щит
    'warrior': lambda l: {1, 2, 3, 4, 6} if l >= 40 else {1, 2, 3, 6},
    'paladin': lambda l: {1, 2, 3, 4, 6} if l >= 40 else {1, 2, 3, 6},
    'hunter':  lambda l: {1, 2, 3} if l >= 40 else {1, 2},
    'shaman':  lambda l: {1, 2, 3, 6} if l >= 40 else {1, 2, 6},
    'rogue':   lambda l: {1, 2},
    'druid':   lambda l: {1, 2},
    'priest':  lambda l: {1},
    'mage':    lambda l: {1},
    'warlock': lambda l: {1},
}
# 0=топор1р 1=топор2р 2=лук 3=ружьё 4=булава1р 5=булава2р 6=древковое
# 7=меч1р 8=меч2р 10=посох 13=кулачное 15=кинжал 16=метательное 18=арбалет 19=жезл
WEAPON = {
    'rogue':   {7, 15, 13, 4, 2, 3, 18, 16},
    'warrior': {0, 1, 4, 5, 6, 7, 8, 10, 13, 15, 2, 3, 18},
    'hunter':  {0, 1, 6, 7, 8, 10, 13, 15, 2, 3, 18},
    'mage':    {7, 15, 10, 19},
    'warlock': {7, 15, 10, 19},
    'priest':  {4, 10, 19},
    'paladin': {0, 1, 4, 5, 6, 7, 8},
    'shaman':  {0, 1, 4, 5, 10, 13, 15},
    'druid':   {4, 5, 6, 10, 13, 15},
}
TWO_HAND = {1, 5, 6, 8, 10}
RANGED_SUB = {2, 3, 16, 18, 19}

# ---------- веса статов ----------
# Взяты из симулятора wowsims/tbc-new (коммит f8d702e7), EP-пресеты первой фазы в
# ui/<класс>/<спек>/presets.ts. Руками не подгоняются: что дал сим, то и стоит.
# Веса относительные внутри класса, между классами не сравниваются.
#
# Сим считает рейд на 70 уровне, поэтому верен порядок статов, а не величины: на
# низких уровнях соотношения другие (у кастеров сим переоценивает интеллект и дух
# — там таланты, которых при прокачке ещё нет).
#
# Поправки при переносе:
#  * сим даёт вес за единицу рейтинга, а часть старых вещей даёт проценты
#    напрямую ("+1% к критическому удару"). Переводим по курсу 70 уровня.
#  * мана-статы (мана, дух, MP5) в рейде решают, при прокачке — нет: там пьют
#    между боями, а не выживают на регене. Ставим их тайбрейкером. От интеллекта
#    оставляем только ту часть, что даёт крит (весом сима на крит, ~80 инты на
#    1%): у мага сим кладёт в инту ещё и Mind Mastery с Arcane Mind, а этих
#    талантов до 50 уровня нет вообще.
#  * урон по школам весит столько, сколько эта школа занимает в уроне спеки:
#    у сима это прямо в пресете (лок — тьма 0.92, огонь 0.07). У мага пресет
#    аркановый, а качаются маги льдом, поэтому доли те же, но на лёд: чужой
#    школе грош цена, фростболту от +27 к урону арканом ничего не достанется.
#  * веса с пометкой "не из сима" — наши. Урон оружия там, где он на ДПС не
#    влияет (кошка, ближний бой у ханта), и броня стоят копейки: разрешить ничью
#    и не оставить слот пустым, когда ничего лучше белой вещи нет.
#
# Чего в весах нет: скорость, пробивание брони, урон по школам, физ. урон оружия,
# сила атаки в форме зверя — этих статов парсер предметов не достаёт, и до 60
# уровня они почти не встречаются.
CRIT_PER_PCT = 22.08   # рейтинга на 1% крита (70 уровень)
HIT_PER_PCT = 15.77    # рейтинга на 1% попадания

WEIGHTS = {
    # rogue/dps, "Combat Swords"
    'rogue':   {'Agility': 2.17, 'Strength': 1.1, 'AttackPower': 1.0, 'Stamina': 0.01,
                'HitRating': 3.06, 'CritRating': 1.7, 'Expertise': 3.47,
                'MeleeCrit%': 1.7 * CRIT_PER_PCT, 'HitChance%': 3.06 * HIT_PER_PCT,
                'WeaponDPS': 9.34,
                'RangedWeaponDPS': 0.5, 'Armor': 0.002},                    # не из сима
    # warrior/dps, "P1 - Fury"
    'warrior': {'Strength': 1.0, 'Agility': 0.68, 'AttackPower': 0.45,
                'HitRating': 1.45, 'CritRating': 0.92, 'Expertise': 1.31,
                'MeleeCrit%': 0.92 * CRIT_PER_PCT, 'HitChance%': 1.45 * HIT_PER_PCT,
                'WeaponDPS': 2.79,
                'RangedWeaponDPS': 0.3, 'Armor': 0.002},                    # не из сима
    # paladin/retribution, "P1"
    'paladin': {'Strength': 1.0, 'Agility': 0.75, 'AttackPower': 0.41,
                'HitRating': 2.19, 'CritRating': 0.77, 'Expertise': 2.18,
                'SpellDamage': 0.14, 'SpellDamageHoly': 0.14,
                'MeleeCrit%': 0.77 * CRIT_PER_PCT, 'HitChance%': 2.19 * HIT_PER_PCT,
                'WeaponDPS': 5.88,
                'Armor': 0.002},                                            # не из сима
    # shaman/enhancement, "Default"
    'shaman':  {'Strength': 2.2, 'Agility': 1.62, 'AttackPower': 1.0, 'Intellect': 0.08,
                'HitRating': 1.9, 'CritRating': 1.73, 'Expertise': 3.1,
                'SpellDamage': 0.56, 'SpellHitRating': 0.55, 'SpellCritRating': 0.13,
                'SpellDamageNature': 0.4, 'SpellDamageFire': 0.4,   # шоки и язык пламени
                'MeleeCrit%': 1.73 * CRIT_PER_PCT, 'HitChance%': 1.9 * HIT_PER_PCT,
                'SpellCrit%': 0.13 * CRIT_PER_PCT,
                'WeaponDPS': 8.19,
                'RangedWeaponDPS': 0.3, 'Armor': 0.002},                    # не из сима
    # hunter/dps, "P1 BM". Главное оружие — дальнее, ближним хант не бьёт
    'hunter':  {'Agility': 1.0, 'Strength': 0.06, 'Intellect': 0.01,
                'RangedAttackPower': 0.4, 'AttackPower': 0.06,
                'HitRating': 0.12, 'CritRating': 0.92,
                'MeleeCrit%': 0.92 * CRIT_PER_PCT, 'HitChance%': 0.12 * HIT_PER_PCT,
                'RangedWeaponDPS': 1.75,
                'WeaponDPS': 0.05, 'Armor': 0.002},                         # не из сима
    # druid/feralcat, "P1". В форме кошки урон оружия не используется
    'druid':   {'Agility': 1.16, 'Strength': 0.78, 'AttackPower': 0.35,
                'HitRating': 1.02, 'CritRating': 0.77, 'Expertise': 1.02,
                'MeleeCrit%': 0.77 * CRIT_PER_PCT, 'HitChance%': 1.02 * HIT_PER_PCT,
                'WeaponDPS': 0.05, 'Armor': 0.002},                         # не из сима
    # mage/dps, "P1 - Arcane"; школы по льду — им и качаются
    'mage':    {'SpellDamage': 1.0, 'SpellDamageFrost': 0.92, 'SpellDamageFire': 0.08,
                'SpellDamageArcane': 0.08,
                'SpellHitRating': 2.36, 'SpellCritRating': 0.83,
                'SpellCrit%': 0.83 * CRIT_PER_PCT,
                'Intellect': 0.3,                                   # только крит-часть
                'Spirit': 0.05, 'MP5': 0.05, 'Mana': 0.005,         # тайбрейкер
                'WeaponDPS': 0, 'RangedWeaponDPS': 0, 'Armor': 0.002},      # не из сима
    # warlock/dps, "P1 - Affli / Demo / Destro"
    'warlock': {'SpellDamage': 1.0, 'SpellDamageShadow': 0.92, 'SpellDamageFire': 0.07,
                'SpellHitRating': 1.73, 'SpellCritRating': 0.82,
                'SpellCrit%': 0.82 * CRIT_PER_PCT,
                'Intellect': 0.23,                                  # только крит-часть
                'MP5': 0.05, 'Mana': 0.005,                         # тайбрейкер
                'WeaponDPS': 0, 'RangedWeaponDPS': 0, 'Armor': 0.002},      # не из сима
    # priest/dps (шадов), "P1"
    'priest':  {'SpellDamage': 1.0, 'SpellDamageShadow': 1.0,
                'SpellHitRating': 1.18, 'SpellCritRating': 0.18,
                'SpellCrit%': 0.18 * CRIT_PER_PCT,
                'Intellect': 0.06,                                  # у жреца сим и так
                'Spirit': 0.05, 'MP5': 0.05,                        # даёт крит-часть
                'WeaponDPS': 0, 'RangedWeaponDPS': 0, 'Armor': 0.002},      # не из сима
}

# Общий рейтинг крита и меткости годится всем, а привязанный к одному виду боя —
# только тому, кто им и бьёт. Хант стреляет, остальные ДПС бьют в ближнем;
# чего в весах нет, то и стоит ноль.
for _cls in ('rogue', 'warrior', 'paladin', 'shaman', 'druid'):
    WEIGHTS[_cls]['MeleeCritRating'] = WEIGHTS[_cls]['CritRating']
    WEIGHTS[_cls]['MeleeHitRating'] = WEIGHTS[_cls]['HitRating']
WEIGHTS['hunter']['RangedCritRating'] = WEIGHTS['hunter']['CritRating']
WEIGHTS['hunter']['RangedHitRating'] = WEIGHTS['hunter']['HitRating']
# Веса выше считают чистый ДПС, выносливость в них стоит около нуля. Тому, кто
# качается один, по этому списку будут бить, поэтому вес выносливости вынесен
# наружу: 0.25 значит "единица выносливости стоит четверти главного стата".
MAIN_STAT = {'rogue': 'Agility', 'warrior': 'Strength', 'paladin': 'Strength',
             'shaman': 'Strength', 'hunter': 'Agility', 'druid': 'Agility',
             'mage': 'SpellDamage', 'warlock': 'SpellDamage', 'priest': 'SpellDamage'}
STAMINA_STEPS = [0, 0.25, 0.5, 1.0]


def weights(cls, stam=0):
    """Веса класса с заданной долей выносливости; 0 - как дал сим."""
    w = dict(WEIGHTS[cls])
    if stam:
        w['Stamina'] = stam * w[MAIN_STAT[cls]]
    return w


OFFHAND_DPS_FACTOR = 0.5   # офф-хенд бьёт вполсилы
DUAL_WIELD_PENALTY = 0.81  # бой двумя руками даёт +19% промахов на обе руки

# ---------- справочники ----------
ITEM_MOD = {0: 'Mana', 1: 'Health', 3: 'Agility', 4: 'Strength', 5: 'Intellect',
            6: 'Spirit', 7: 'Stamina', 12: 'DefenseRating', 18: 'SpellHitRating',
            21: 'SpellCritRating', 31: 'HitRating', 32: 'CritRating', 37: 'Expertise',
            38: 'AttackPower', 43: 'MP5', 45: 'SpellDamage'}
STAT_IDX = {-1: 'AllStats', 0: 'Strength', 1: 'Agility', 2: 'Stamina', 3: 'Intellect', 4: 'Spirit'}
# "+N к урону заклинаний" в игре бывает по школам: маска школы лежит в
# EffectMiscValue. Все школы магии разом (126) - это обычный урон заклинаний,
# одна школа - только для того, кто ей кастует.
SCHOOL = {2: 'Holy', 4: 'Fire', 8: 'Nature', 16: 'Frost', 32: 'Shadow', 64: 'Arcane'}
ALL_MAGIC = 126
# Рейтинги навешиваются аурой 189, в EffectMiscValue лежит маска видов боя.
# Ближний и дальний бой считаем врозь: "+14 к криту дальнего боя" разбойнику
# не даёт ничего, он из лука не бьёт, а раньше это шло в общий крит.
RATING = {32: 'MeleeHitRating', 64: 'RangedHitRating', 96: 'HitRating',
          128: 'SpellHitRating', 256: 'MeleeCritRating', 512: 'RangedCritRating',
          768: 'CritRating', 1024: 'SpellCritRating'}

spells = {r['Id']: r for r in q('SELECT * FROM spell_template')}
sie = {int(r['ID']): r for r in csv.DictReader(open('sie.csv'))}          # SpellItemEnchantment
irp = {int(r['ID']): r for r in csv.DictReader(open('irp.csv'))}          # ItemRandomProperties
rand_variants = collections.defaultdict(list)
CHANCE = collections.defaultdict(dict)     # группа -> градация -> шанс выпасть
for r in q('SELECT entry, ench, chance FROM item_enchantment_template'):
    rand_variants[r['entry']].append(r['ench'])
    CHANCE[r['entry']][r['ench']] = r['chance']


def _ids(sql):
    return {r[0] for r in con.execute(sql) if r[0]}


# достижимые предметы: всё, что можно выбить, купить, получить за квест или скрафтить.
# заодно отсекает тестовый и deprecated мусор, оставленный в данных.
OBTAINABLE = (
    _ids('SELECT item FROM creature_loot_template')
    | _ids('SELECT item FROM gameobject_loot_template')
    | _ids('SELECT item FROM reference_loot_template')
    | _ids('SELECT item FROM npc_vendor') | _ids('SELECT item FROM npc_vendor_template')
    | set().union(*[_ids('SELECT EffectItemType%d FROM spell_template WHERE Effect%d=24'
                         % (n, n)) for n in (1, 2, 3)])
    | set().union(*[_ids('SELECT %s FROM quest_template' % c) for c in
                    ['RewItemId%d' % i for i in range(1, 5)] +
                    ['RewChoiceItemId%d' % i for i in range(1, 7)]])
)


def add_spell_auras(out, spell_id):
    sp = spells.get(spell_id)
    if not sp:
        return
    for e in range(1, 4):
        aura, val, misc = (sp['EffectApplyAuraName%d' % e],
                           sp['EffectBasePoints%d' % e] + 1, sp['EffectMiscValue%d' % e])
        if aura == 29:
            key = STAT_IDX.get(misc)
            if key == 'AllStats':
                for k in ('Strength', 'Agility', 'Stamina', 'Intellect', 'Spirit'):
                    out[k] += val
            elif key:
                out[key] += val
        elif aura == 99:
            out['AttackPower'] += val
        elif aura == 124:
            out['RangedAttackPower'] += val
        elif aura == 13:
            if misc & ALL_MAGIC == ALL_MAGIC:
                out['SpellDamage'] += val
            elif misc in SCHOOL:
                out['SpellDamage' + SCHOOL[misc]] += val
            elif misc == 1:
                out['PhysDamageDone'] += val    # это не магия, веса на него нет
            else:
                out['SpellDamage'] += val       # редкие смешанные маски
        elif aura == 52:
            out['MeleeCrit%'] += val
        elif aura == 54:
            out['HitChance%'] += val
        elif aura == 189 and misc in RATING:
            out[RATING[misc]] += val


# Вещи без статов и без осмысленной брони в список не нужны. Порог подобран по
# данным: на 2-3 брони сидит стартовая и косметическая одежда (Ruby Shades,
# Tuxedo Jacket, Festival Dress, Recruit's Pants), с 4 начинается настоящий шмот.
MIN_USEFUL_ARMOR = 4


def is_useful(st):
    if any(k != 'Armor' for k in st):
        return True
    return st.get('Armor', 0) >= MIN_USEFUL_ARMOR


def base_stats(it):
    out = collections.Counter()
    for n in range(1, 11):
        t, v = it['stat_type%d' % n], it['stat_value%d' % n]
        if v and t in ITEM_MOD:
            out[ITEM_MOD[t]] += v
    for n in range(1, 6):
        if it['spellid_%d' % n] and it['spelltrigger_%d' % n] == 1:
            add_spell_auras(out, it['spellid_%d' % n])
    if it['armor']:
        out['Armor'] += it['armor']
    if it['dmg_max1'] and it['delay']:
        dps = round((it['dmg_min1'] + it['dmg_max1']) / 2 / (it['delay'] / 1000), 1)
        out['RangedWeaponDPS' if it['class'] == 2 and it['subclass'] in RANGED_SUB
            else 'WeaponDPS'] += dps
    return out


def suffix_stats(prop_id):
    """ItemRandomProperties -> имя суффикса и его статы."""
    p = irp.get(prop_id)
    if not p:
        return None, collections.Counter()
    out = collections.Counter()
    for i in range(5):
        eid = int(p['Enchantment_%d' % i] or 0)
        if not eid or eid not in sie:
            continue
        e = sie[eid]
        for n in range(3):
            typ = int(e.get('Effect_%d' % n) or 0)
            val = int(e.get('EffectPointsMin_%d' % n) or 0)
            arg = int(e.get('EffectArg_%d' % n) or 0)
            if typ == 5 and arg in ITEM_MOD:        # плоский стат
                out[ITEM_MOD[arg]] += val
            elif typ == 3:                          # навешенный спелл
                add_spell_auras(out, arg)
            elif typ == 2:                          # +урон оружия
                out['WeaponFlatDamage'] += val
    return p['Name_lang'], out


def graded(it):
    """Предмет как его видно на аукционе: одно название - одна позиция.

    У суффикса с одним названием бывает несколько сил: «of the Tiger» это и 4/4,
    и 3/3, а в списке лотов они не различаются. Поэтому градации возвращаются
    вместе, а какая достанется - решает ролл при создании вещи.

    Даёт (название суффикса или None, [(статы, шанс градации)]).
    """
    base = base_stats(it)
    if is_useful(base):
        yield None, [(base, 1.0)]
    grades = collections.defaultdict(list)
    for prop in rand_variants.get(it['RandomProperty'], []):
        name, extra = suffix_stats(prop)
        if not name or not extra:
            continue
        st = base_stats(it)
        st.update(extra)
        if is_useful(st):
            grades[name].append((st, CHANCE[it['RandomProperty']].get(prop, 0)))
    yield from grades.items()


def expected(grades, score):
    """Средний ролл: градации, взвешенные по шансам. Шансы в базе бывают
    нулевыми - тогда считаем градации равновероятными."""
    got = [(score(st), c) for st, c in grades]
    total = sum(c for _, c in got)
    return (sum(s * c for s, c in got) / total if total
            else sum(s for s, _ in got) / len(got))


def run(cls, lvl, stam=0):
    bit = 1 << (CLASS_ID[cls] - 1)
    armor_ok, weap_ok, w = ARMOR[cls](lvl), WEAPON[cls], weights(cls, stam)
    score = lambda st, oh=False: sum(
        w.get(k, 0) * v * (OFFHAND_DPS_FACTOR if oh and k == 'WeaponDPS' else 1)
        for k, v in st.items())

    # bonding: 2 = привязка при надевании, 0 = не привязывается вообще. И то и другое
    # свободно покупается на аукционе. RequiredSkill>0 = нужна профессия, чтобы надеть.
    # Качество берём любое, включая серое: на низких уровнях серая вещь лучше пустого
    # слота. По имени отсекаем служебное: "Deprecated ..." - вырезанный контент,
    # "Monster - ..." - снаряжение неписей, игроку недоступное.
    pool = q("SELECT * FROM item_template WHERE bonding IN (0,2) AND InventoryType>0 "
             "AND RequiredLevel<=? AND RequiredSkill=0 "
             "AND name NOT LIKE 'Deprecated%' AND name NOT LIKE 'Monster -%'", lvl)

    by_slot = collections.defaultdict(list)
    for it in pool:
        if it['entry'] not in OBTAINABLE:
            continue
        ac = it['AllowableClass']
        if ac not in (-1, 0) and not (ac & bit):
            continue
        if it['class'] == 4:
            if it['subclass'] not in armor_ok | {0}:
                continue
        elif it['class'] == 2:
            if it['subclass'] not in weap_ok:
                continue
        else:
            continue
        # вещь оценивается по среднему роллу, из её названий берём лучшее
        opts = [(sfx, grades, expected(grades, score)) for sfx, grades in graded(it)]
        if not opts:
            continue
        sfx, grades, exp = max(opts, key=lambda o: o[2])
        if exp > 0:
            name = '%s %s' % (it['name'], sfx) if sfx else it['name']
            by_slot[it['InventoryType']].append((name, grades, it))

    for v in by_slot[13]:                       # одноручка годится в обе руки
        by_slot[21].append(v)
        by_slot[22].append(v)
    by_slot.pop(13, None)

    SLOT = {1: 'Голова', 2: 'Шея', 3: 'Плечи', 16: 'Спина', 5: 'Грудь', 20: 'Грудь',
            9: 'Запястья', 10: 'Кисти', 6: 'Пояс', 7: 'Ноги', 8: 'Ступни', 11: 'Кольцо',
            12: 'Тринкет', 15: 'Дальний бой', 25: 'Метательное', 26: 'Дальний бой'}

    def points(row, oh=False):
        return expected(row[1], lambda st: score(st, oh))

    def top(slot, oh=False, n=2):
        return sorted(by_slot.get(slot, []), key=lambda x: -points(x, oh))[:n]

    def show(label, rows, oh=False):
        for n, row in enumerate(rows):
            name, grades, _ = row
            # у роллящейся вещи стат печатается вилкой: «Agility 3-4»
            low = {k: min(st.get(k, 0) for st, _ in grades) for st, _ in grades for k in st}
            high = {k: max(st.get(k, 0) for st, _ in grades) for st, _ in grades for k in st}
            line = ' '.join('%s %g%s' % (k, low[k], '' if low[k] == high[k] else '-%g' % high[k])
                            for k in high if k != 'Armor' and high[k])
            print('%-14s %-42s %5.0f  %s' % (label if n == 0 else '', name[:42],
                                             points(row, oh), line[:56]))
        if rows:
            print()

    print('=== %s, уровень %d ===\n' % (cls, lvl))
    for slot in [1, 2, 3, 16, 5, 9, 10, 6, 7, 8, 11, 12]:
        show(SLOT.get(slot, slot), top(slot))

    # двуручка против пары одноручек
    mh, off = top(21, n=1), top(22, oh=True, n=1)
    two = top(17, n=1)
    pair_score = ((points(mh[0]) if mh else 0)
                  + (points(off[0], True) if off else 0)) * DUAL_WIELD_PENALTY
    two_score = points(two[0]) if two else 0
    if two_score > pair_score:
        show('Двуручное', two)
        if pair_score:
            print('%-14s %-42s %5.0f  (проигрывает двуручке)\n'
                  % ('  вариант', mh[0][0][:28] + ' + ' + (off[0][0][:24] if off else '—'),
                     pair_score))
    else:
        show('Правая рука', top(21))
        show('Левая рука', top(22, oh=True), oh=True)
        if two_score:
            print('%-14s %-42s %5.0f  (проигрывает паре)\n' % ('  вариант', two[0][0][:42],
                                                               two_score))
    # луки, ружья, арбалеты, жезлы и метательное делят один слот
    for s in (25, 26):
        by_slot[15] += by_slot.pop(s, [])
    show('Дальний бой', top(15))


if __name__ == '__main__':
    run(sys.argv[1] if len(sys.argv) > 1 else 'rogue',
        int(sys.argv[2]) if len(sys.argv) > 2 else 39,
        float(sys.argv[3]) if len(sys.argv) > 3 else 0)
