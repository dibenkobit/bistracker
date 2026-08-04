"""Кому из фракций доступен предмет - по всем способам получения сразу.

Импортируется из export.py. Запуск напрямую печатает отчёт по текущему bis.json.
"""
import sys, csv, collections
sys.path.insert(0, '.')
import bis as B

ALLI, HORDE = 2, 4                      # биты FactionGroup из FactionTemplate
RACES = {'A': 1 | 4 | 8 | 64 | 1024, 'H': 2 | 16 | 32 | 128 | 512}
BIT = {'A': ALLI, 'H': HORDE}

ft = {int(r['ID']): r for r in csv.DictReader(open('ft.csv'))}


def relation(tpl, bit):
    """Как фракция НПС относится к игроку: friendly | hostile | neutral."""
    f = ft.get(tpl)
    if not f:
        return 'neutral'
    grp, friend, enemy = (int(f['FactionGroup']), int(f['FriendGroup']), int(f['EnemyGroup']))
    if enemy & bit:
        return 'hostile'
    if (friend & bit) or (grp & bit):
        return 'friendly'
    return 'neutral'


# убить можно всё, что не дружественно; купить - у всего, что не враждебно
killable = lambda tpl, bit: relation(tpl, bit) != 'friendly'
tradeable = lambda tpl, bit: relation(tpl, bit) != 'hostile'

# ---------- индексы источников ----------
loot_faction = collections.defaultdict(set)
for lid, fac in B.q('SELECT LootId, Faction FROM creature_template WHERE LootId>0'):
    loot_faction[lid].add(fac)

_ref_items, _ref_edges = collections.defaultdict(set), collections.defaultdict(set)
for e, item, mn in B.q('SELECT entry, item, mincountOrRef FROM reference_loot_template'):
    _ref_items[e].add(item)
    if mn < 0:
        _ref_edges[e].add(-mn)
for _ in range(3):
    for e, kids in _ref_edges.items():
        for k in kids:
            _ref_items[e] |= _ref_items[k]
item2ref = collections.defaultdict(set)
for e, items in _ref_items.items():
    for i in items:
        item2ref[i].add(e)

drop_entries, via_ref = collections.defaultdict(set), collections.defaultdict(set)
for e, item, mn in B.q('SELECT entry, item, mincountOrRef FROM creature_loot_template'):
    drop_entries[item].add(e)
    if mn < 0:
        via_ref[-mn].add(e)

npc_faction = {e: f for e, f in B.q('SELECT entry, Faction FROM creature_template')}
vendor_faction = collections.defaultdict(set)
for e, item in B.q('SELECT entry, item FROM npc_vendor'):
    if e in npc_faction:
        vendor_faction[item].add(npc_faction[e])
_tpl2npc = collections.defaultdict(list)
for e, vt in B.q('SELECT entry, VendorTemplateId FROM creature_template WHERE VendorTemplateId>0'):
    _tpl2npc[vt].append(e)
for e, item in B.q('SELECT entry, item FROM npc_vendor_template'):
    for npc in _tpl2npc.get(e, []):
        if npc in npc_faction:
            vendor_faction[item].add(npc_faction[npc])

quest_races = collections.defaultdict(set)
_cols = ['RewItemId%d' % i for i in range(1, 5)] + ['RewChoiceItemId%d' % i for i in range(1, 7)]
for row in B.q('SELECT RequiredRaces, %s FROM quest_template' % ','.join(_cols)):
    for it in row[1:]:
        if it:
            quest_races[it].add(row[0])

OBJECT_LOOT = {r[0] for r in B.q('SELECT item FROM gameobject_loot_template')}
ITEM_RACE = {e: r for e, r in B.q('SELECT entry, AllowableRace FROM item_template')}
CRAFTED = set()
for _n in (1, 2, 3):
    CRAFTED |= {r[0] for r in B.con.execute(
        'SELECT EffectItemType%d FROM spell_template WHERE Effect%d=24' % (_n, _n)) if r[0]}

_cache = {}


def available_to(item, side):
    """Может ли сторона ('A' или 'H') добыть и надеть предмет."""
    key = (item, side)
    if key in _cache:
        return _cache[key]
    bit, races = BIT[side], RACES[side]

    ar = ITEM_RACE.get(item, -1)
    if ar not in (-1, 0) and not (ar & races):
        return _cache.setdefault(key, False)     # такую расу не пустят надеть

    if item in CRAFTED or item in OBJECT_LOOT:
        return _cache.setdefault(key, True)

    entries = set(drop_entries[item])
    for r in item2ref[item]:
        entries |= via_ref[r]
    for e in entries:
        if any(killable(f, bit) for f in loot_faction.get(e, {0})):
            return _cache.setdefault(key, True)
    for f in vendor_faction.get(item, ()):
        if tradeable(f, bit):
            return _cache.setdefault(key, True)
    for req in quest_races.get(item, ()):
        if req in (0, -1) or (req & races):
            return _cache.setdefault(key, True)

    # источник не привязался ни к кому - считаем нейтральным, а не запретным
    unknown = not entries and not vendor_faction.get(item) and not quest_races.get(item)
    return _cache.setdefault(key, unknown)


if __name__ == '__main__':
    import json
    d = json.load(open('bis.json'))
    locked = collections.defaultdict(list)
    for iid, meta in d['items'].items():
        i = int(iid)
        a, h = available_to(i, 'A'), available_to(i, 'H')
        if a != h:
            locked['только Альянс' if a else 'только Орда'].append(meta['name'])
    print('предметов в списках:', len(d['items']))
    for k, v in locked.items():
        print('\n%s: %d' % (k, len(v)))
        for n in sorted(v):
            print('   ', n)
