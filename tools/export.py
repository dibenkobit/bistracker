"""Генерирует bis.json: лучший BOE-шмот для 9 классов на уровнях 10-60.

На слот пишется не одна вещь, а топ-10: на аукционе лучшей может не оказаться,
и тогда нужен ответ «что взять вместо». Первая строка списка - она и есть BiS.

Условия отбора: BOE, не требует профессии для надевания, достижим в игре.
"""
import collections
import csv
import json

import bis as B
import faction as F

con, q = B.con, B.q

FACTIONS = {'alliance': 'A', 'horde': 'H'}

# иконки: Item.IconFileDataID -> ManifestInterfaceData -> имя файла на CDN Wowhead
with open('Item.csv', encoding='utf-8') as _f:
    _fdid = {int(r['ID']): int(r['IconFileDataID'] or 0) for r in csv.DictReader(_f)}
with open('ManifestInterfaceData.csv', encoding='utf-8') as _f:
    _name = {int(r['ID']): r['FileName'].rsplit('.', 1)[0].lower()
             for r in csv.DictReader(_f)
             if r['FilePath'].lower().startswith('interface\\icons')}
ICON = lambda entry: _name.get(_fdid.get(entry, 0))

# ---------- кандидаты: статы считаем один раз, а не на каждый класс ----------
# Кандидат - это не отдельный ролл, а вещь с одним названием: «Prairie Ring of
# the Tiger» бывает от 3/3 до 4/4, а на аукционе все лоты названы одинаково.
# Поэтому градации держим вместе (B.graded) и оцениваем вещь по среднему роллу.
print('готовлю кандидатов...')
CAND = []          # (item_row, suffix_name, [(stats, шанс градации)])
for it in q("SELECT * FROM item_template WHERE bonding IN (0,2) AND InventoryType>0 "
            "AND RequiredLevel<=60 AND RequiredSkill=0 "
            "AND name NOT LIKE 'Deprecated%' AND name NOT LIKE 'Monster -%'"):
    if it['entry'] not in B.OBTAINABLE or it['class'] not in (2, 4):
        continue
    for sufname, grades in B.graded(it):
        CAND.append((it, sufname, grades))
print('кандидатов (вещей с суффиксами):', len(CAND))

SLOT = {1: 'head', 2: 'neck', 3: 'shoulder', 5: 'chest', 20: 'chest', 6: 'waist',
        7: 'legs', 8: 'feet', 9: 'wrist', 10: 'hands', 11: 'finger', 12: 'trinket',
        16: 'back', 13: 'onehand', 21: 'mainhand', 22: 'offhand', 17: 'twohand',
        15: 'ranged', 25: 'ranged', 26: 'ranged'}

PAIRED_SLOTS = {'finger', 'trinket'}   # в игре их по два
TOP = 11                               # надетое плюс десять замен

items_out = {}
bis_out = {f: {} for f in FACTIONS}
rows_out, rows_seen = [], {}           # строки: предмет с суффиксом и статами
lists_out, lists_seen = [], {}         # готовые топ-10, одинаковых много

def remember(it):
    key = str(it['entry'])
    if key in items_out:
        return
    items_out[key] = {'name': it['name'], 'q': it['Quality'],
                      'lvl': it['RequiredLevel'], 'ilvl': it['ItemLevel'],
                      'icon': ICON(it['entry']),
                      # для тултипа: тип предмета, броня, урон, прочность
                      'inv': it['InventoryType'], 'cls': it['class'],
                      'sub': it['subclass'], 'boe': it['bonding'] == 2,
                      'uniq': it['maxcount'] == 1}
    extra = {'armor': it['armor'], 'dura': it['MaxDurability'],
             'dmin': it['dmg_min1'], 'dmax': it['dmg_max1'],
             'speed': it['delay'] / 1000 if it['delay'] else 0,
             # для 3D-модели: чем предмет выглядит на персонаже
             'display': it['displayid']}
    items_out[key].update({k: v for k, v in extra.items() if v})


def bounds(grades):
    """Разброс статов по градациям: самый бедный ролл и самый богатый."""
    # порядок статов - как они шли в самой вещи, а не как лягут в множество:
    # иначе он менялся бы от запуска к запуску вместе с хешами строк
    keys = dict.fromkeys(k for st, _ in grades for k in st)
    low = {k: min(st.get(k, 0) for st, _ in grades) for k in keys}
    high = {k: max(st.get(k, 0) for st, _ in grades) for k in keys}
    return low, high


# статы зависят только от предмета и суффикса, а не от класса и уровня - поэтому
# строка хранится один раз на весь файл, а списки ссылаются на неё номером
def row_id(it, sufname, grades):
    low, high = bounds(grades)
    key = (it['entry'], sufname, tuple(sorted(high.items())), tuple(sorted(low.items())))
    if key not in rows_seen:
        remember(it)
        rows_seen[key] = len(rows_out)
        row = {'item': it['entry'], 'sfx': sufname,
               'stats': {k: round(v, 1) for k, v in high.items() if v}}
        if low != high:                       # вещь роллится - у статов вилка
            row['low'] = {k: round(v, 1) for k, v in low.items() if v}
        rows_out.append(row)
    return rows_seen[key]


def list_id(cands):
    """Список из кандидатов [(средние очки, худшие, лучшие, предмет, суффикс, градации)].

    Рядом с номером строки идёт доля от лучшего варианта в процентах - по ней и
    видно, дорого ли обходится замена. Один и тот же список встречается на
    соседних уровнях и на разных положениях ползунка, поэтому он тоже хранится
    один раз, а уровень ссылается на него номером.

    У роллящейся вещи после среднего идут ещё два числа - сколько дают самый
    бедный и самый богатый ролл. Тогда в списке она стоит на своём честном
    месте, а разброс виден отдельно.
    """
    best = max(c[0] for c in cands)
    top = []
    for exp, lo, hi, it, sfx, grades in cands[:TOP]:
        pct = [round(100 * exp / best)]
        if lo != hi:
            pct += [round(100 * lo / best), round(100 * hi / best)]
        top.append([row_id(it, sfx, grades)] + pct)
    key = json.dumps(top, separators=(',', ':'))
    if key not in lists_seen:
        lists_seen[key] = len(lists_out)
        lists_out.append(top)
    return lists_seen[key]


for faction, side in FACTIONS.items():
  for cls in B.WEIGHTS:
    bit = 1 << (B.CLASS_ID[cls] - 1)
    weap_ok = B.WEAPON[cls]
    bis_out[faction][cls] = {}

    for lvl in range(10, 61):
        armor_ok = B.ARMOR[cls](lvl) | {0}

        # отбор предметов от весов не зависит: фильтруем один раз, а считаем
        # столько раз, сколько у ползунка выносливости положений
        pool = []
        for it, sufname, grades in CAND:
            if it['RequiredLevel'] > lvl:
                continue
            if not F.available_to(it['entry'], side):
                continue
            ac = it['AllowableClass']
            if ac not in (-1, 0) and not (ac & bit):
                continue
            if it['class'] == 4 and it['subclass'] not in armor_ok:
                continue
            if it['class'] == 2 and it['subclass'] not in weap_ok:
                continue
            slot = SLOT.get(it['InventoryType'])
            if slot:
                pool.append((slot, it, sufname, grades))

        steps = []
        for stam in B.STAMINA_STEPS:
            w = B.weights(cls, stam)
            # w и score привязаны значением по умолчанию: иначе лямбда смотрела
            # бы на переменную цикла, и следующий шаг ползунка менял бы её под ней
            score = lambda st, oh=False, w=w: sum(
                w.get(k, 0) * v * (B.OFFHAND_DPS_FACTOR if oh and k == 'WeaponDPS' else 1)
                for k, v in st.items())

            ranked = collections.defaultdict(list)
            for slot, it, sufname, grades in pool:
                # кольца и аксессуары сортируем один раз на оба слота
                for tgt in (['mainhand', 'offhand'] if slot == 'onehand' else [slot]):
                    at = lambda st, oh=tgt == 'offhand', score=score: score(st, oh)
                    exp = B.expected(grades, at)
                    if exp > 0:
                        got = [at(st) for st, _ in grades]
                        ranked[tgt].append((exp, min(got), max(got), it, sufname, grades))
            # порядок - по среднему роллу, но округлённый до того процента,
            # который виден в интерфейсе: при равных процентах разрыв меньше
            # погрешности весов, и тогда впереди идёт вещь с фиксированными
            # статами - её шесть ловкости достанутся точно, а роллящейся
            # соседке нужно ещё, чтобы повезло
            for cands in ranked.values():
                top = max(c[0] for c in cands)
                cands.sort(key=lambda c: (-round(100 * c[0] / top), c[1] != c[2], -c[0]))

            first = lambda slot, ranked=ranked: (
                max(c[0] for c in ranked[slot]) if ranked.get(slot) else 0)
            pair = (first('mainhand') + first('offhand')) * B.DUAL_WIELD_PENALTY
            if first('twohand') > pair:
                ranked.pop('mainhand', None), ranked.pop('offhand', None)
            else:
                ranked.pop('twohand', None)

            step = {}
            for slot, cands in ranked.items():
                if slot not in PAIRED_SLOTS:
                    step[slot] = list_id(cands)
                    continue
                # два кольца / два аксессуара. maxcount=1 - вещь уникальная,
                # второй такой не наденешь, тогда во втором слоте список
                # начинается со следующего предмета
                step[slot + '1'] = list_id(cands)
                rest = ([c for c in cands if c[3]['entry'] != cands[0][3]['entry']]
                        if cands[0][3]['maxcount'] == 1 else cands)
                if rest:
                    step[slot + '2'] = list_id(rest)
            steps.append(step)

        bis_out[faction][cls][lvl] = steps
    print('  %-9s %-8s готово' % (faction, cls))

with open('bis.json', 'w', encoding='utf-8') as _out:
    json.dump({'items': items_out, 'stam': B.STAMINA_STEPS,
               'rows': rows_out, 'lists': lists_out, 'bis': bis_out},
              _out, ensure_ascii=False, separators=(',', ':'))
print('\nbis.json: %d предметов, %d строк, %d списков по %d вариантов'
      % (len(items_out), len(rows_out), len(lists_out), TOP))
print('%d фракции x %d классов x 51 уровень x %d веса'
      % (len(bis_out), len(B.WEIGHTS), len(B.STAMINA_STEPS)))
