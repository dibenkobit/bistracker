"""Сверка наших списков с твинк-листами Wowhead.

Внешней проверки у весов иначе нет: твинк-листы годами вылизывало сообщество,
и это единственный доступный ориентир на низких уровнях. Совпадения один в один
не будет и не надо - там PvP, BOP из данжей и выносливость, - но если списки
расходятся полностью, значит веса врут.

Страница гир-сета на Wowhead содержит JSON вида state: {"level":39,"slots":...},
оттуда и берём чужой набор. Сравниваем только те их предметы, которые вообще
проходят наш отбор (BOE, без профессии, тот же класс): остальное не наш охват.

    python3 check.py
"""
import collections, json, re, urllib.request
import bis as B

SETS = {  # только ДПС-наборы; название до дефиса - класс, из JSON берётся уровень
    'druid-19':    'https://www.wowhead.com/tbc/gear-set/druid-19-twink-bis-151694',
    'hunter-19':   'https://www.wowhead.com/tbc/gear-set/hunter-19-twink-bis-151692',
    'priest-19':   'https://www.wowhead.com/tbc/gear-set/priest-19-twink-bis-151695',
    'rogue-19':    'https://www.wowhead.com/tbc/gear-set/19-twink-rogue-bis-tbc-139339',
    'warrior-19':  'https://www.wowhead.com/tbc/gear-set/warrior-19-affordable-twink-206241',
    'hunter-29':   'https://www.wowhead.com/tbc/gear-set/29-twink-hunter-bis-140019',
    'hunter-29b':  'https://www.wowhead.com/tbc/gear-set/29-twink-hunter-full-bis-140073',
    'mage-39':     'https://www.wowhead.com/classic/gear-set/39-frost-mage-twink-29993',
    'mage-39b':    'https://www.wowhead.com/classic/gear-set/twink-mage-39-124156',
    'paladin-39':  'https://www.wowhead.com/classic/gear-set/lvl-39-ret-paladin-twink-wow-classic-37749',
    'paladin-39b': 'https://www.wowhead.com/classic/gear-set/paladin-39lvl-twink-retribution-185440',
    'priest-39':   'https://www.wowhead.com/tbc/gear-set/39-twink-shadow-priest-bis-139637',
    'priest-39b':  'https://www.wowhead.com/classic/gear-set/39-priest-twink-95626',
    'rogue-39':    'https://www.wowhead.com/tbc/gear-set/39-rogue-twink-208559',
    'rogue-39b':   'https://www.wowhead.com/classic/gear-set/bis-twink-39-15947',
    'shaman-39':   'https://www.wowhead.com/classic/gear-set/p1-39-enhancement-shaman-twink-124813',
    'shaman-39b':  'https://www.wowhead.com/classic/gear-set/39-shaman-twink-ench-pod-3901',
    'warlock-39':  'https://www.wowhead.com/tbc/gear-set/39-warlock-twink-140989',
    'warlock-39b': 'https://www.wowhead.com/tbc/gear-set/warlock-39-tbc-twink-130269',
}


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req, timeout=30).read().decode('utf-8', 'replace')
    i = html.find('state: {')
    if i < 0:
        return None
    d, _ = json.JSONDecoder().raw_decode(html[i + len('state: '):])
    return d['level'], {int(k): v['item'] for k, v in d['slots'].items() if v.get('item')}


def ranked(cls, lvl, weights=None):
    """наши кандидаты по слотам, от лучшего к худшему"""
    w = weights or B.WEIGHTS[cls]
    bit, armor_ok, weap_ok = 1 << (B.CLASS_ID[cls] - 1), B.ARMOR[cls](lvl), B.WEAPON[cls]
    score = lambda st: sum(w.get(k, 0) * v for k, v in st.items())
    by = collections.defaultdict(list)
    for it in B.q("SELECT * FROM item_template WHERE bonding IN (0,2) AND InventoryType>0 "
                  "AND RequiredLevel<=? AND RequiredSkill=0 "
                  "AND name NOT LIKE 'Deprecated%' AND name NOT LIKE 'Monster -%'", lvl):
        if it['entry'] not in B.OBTAINABLE or it['class'] not in (2, 4):
            continue
        ac = it['AllowableClass']
        if ac not in (-1, 0) and not (ac & bit):
            continue
        if it['class'] == 4 and it['subclass'] not in armor_ok | {0}:
            continue
        if it['class'] == 2 and it['subclass'] not in weap_ok:
            continue
        # как в приложении: вещь оценивается по среднему роллу, а не по топовому
        best = max((B.expected(grades, score) for _, grades in B.graded(it)), default=0)
        if best > 0:
            slot = 21 if it['InventoryType'] == 13 else it['InventoryType']
            by[slot].append((best, it['entry'], it['name']))
    for v in by.values():
        v.sort(key=lambda x: -x[0])
    return by


def place(by, it):
    slot = 21 if it['InventoryType'] == 13 else it['InventoryType']
    lst = by.get(slot, [])
    pos = next((i + 1 for i, (_, e, _) in enumerate(lst) if e == it['entry']), None)
    return pos, lst


total, per, mismatch = collections.Counter(), collections.defaultdict(collections.Counter), []
for name, url in sorted(SETS.items()):
    got = fetch(url)
    if not got:
        print('не разобрал страницу:', name)
        continue
    lvl, items = got
    cls = name.split('-')[0]
    ours = ranked(cls, lvl)
    # с выносливостью как у главного стата: так набирают твинки под PvP
    stam = dict(B.WEIGHTS[cls], Stamina=0.5 if cls in ('mage', 'warlock', 'priest') else 1.0)
    pvp = ranked(cls, lvl, stam)
    print('%-12s уровень %2d, предметов %2d' % (name, lvl, len(items)))
    for entry in sorted(set(items.values())):
        row = B.q('SELECT * FROM item_template WHERE entry=?', entry)
        if not row:
            continue
        it = row[0]
        pos, lst = place(ours, it)
        if pos is None:
            total['вне охвата'] += 1
            continue
        bucket = 'топ-3' if pos <= 3 else 'топ-10' if pos <= 10 else 'мимо'
        total[bucket] += 1
        per[cls][bucket] += 1
        if bucket == 'мимо':
            mismatch.append((name, it['name'], pos, place(pvp, it)[0], lst[0][2]))

n = total['топ-3'] + total['топ-10'] + total['мимо']
print('\n=== по классам ===')
for cls, c in sorted(per.items()):
    print('%-8s сравнимо %2d: топ-3 %2d, топ-10 %2d, мимо %2d'
          % (cls, sum(c.values()), c['топ-3'], c['топ-10'], c['мимо']))
print('\nсравнимо %d предметов (вне охвата %d): топ-3 %d (%d%%), топ-10 %d (%d%%)'
      % (n, total['вне охвата'], total['топ-3'], 100 * total['топ-3'] / n,
         total['топ-3'] + total['топ-10'], 100 * (total['топ-3'] + total['топ-10']) / n))

# если позиция резко подскакивает от веса выносливости - расхождение про PvP, а не про веса
print('\n=== расхождения (место у нас -> место, если ценить выносливость) ===')
for name, item, pos, pvp_pos, top in mismatch:
    print('%-12s %-32s %3d -> %-4s   мы ставим %s'
          % (name, item[:32], pos, pvp_pos if pvp_pos else '-', top[:28]))
