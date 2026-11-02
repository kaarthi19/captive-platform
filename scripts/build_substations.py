"""Nearest PLN substation and grid-connection estimate for each platform site.

Reads the sites in data/parks.csv and an OpenStreetMap extract of Indonesian substations, and
writes:

  assets/js/substations.js     window.SUBSTATIONS for the facility and region pages
  data/site_substations.csv    the same as a flat table
  data/osm_pln_substations.csv the PLN substations used (150 kV and above), for reproducibility

For each site it finds the nearest PLN-operated substation at 150 kV or above (OSM operator tag
PLN / Perusahaan Listrik Negara; GITETs count even without a voltage tag), the straight-line
distance to it, and a rough cost of building a line that far. A real line route is longer than
the straight line. Substations on the site's own landmass come first (landmasses are the land
map's polygons joined where they share a border); a site whose island has none gets the nearest
one overall, flagged as a sea crossing, with no overhead line cost.

Where RUPTL 2025-2034 (Appendix E, large customers) names the substation PLN plans to supply the
site from, that plan is added from a matched CSV (--ruptl).

Usage:
  python3 scripts/build_substations.py OSM_JSON --land IDN_TOPOJSON [--ruptl CONNECTIONS_CSV]

  OSM_JSON   Overpass API output (out center tags) for power=substation in Indonesia
  --land     datamaps idn.topo.json (the basemap the site draws), used for the sea test
  --ruptl    RUPTL connections matched to sites (data/ruptl_connections.csv: site_id, substation,
             voltage_kv, line_km, ..., match_confidence), read from RUPTL 2025-2034 pages 1203-1251
"""
import argparse
import csv
import json
import math
import os
import re
from datetime import date

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PLN = re.compile(r'\bpln\b|perusahaan listrik negara', re.I)
# Not substations, though tagged as such in OSM.
SKIP = re.compile(r'landing point', re.I)
MIN_KV = 150
# Grid connection cost, US$ million per km: RUPTL 2025-2034's planned spend on lines and
# substations (Tabel 6.1, "TL dan GI", Rp 392.1 trillion) over its planned circuit-km (Tabel
# 5.187/5.188, 47,758 kms) at Rp 16,100/USD. Substations are included and RUPTL gives no split by
# voltage, so this is one rough rate for every voltage.
COST_PER_KM = 0.5
# A point off the coarse land map (a coastal site, a small island) is put on the nearest landmass
# within this many km; beyond it its island is treated as missing from the map.
SNAP_KM = 15.0
# Land polygons closer than this are treated as one landmass (see landmasses()).
MERGE_KM = 8.0


def km(a, b):
    p = math.pi / 180
    h = (math.sin((b[0] - a[0]) * p / 2) ** 2 +
         math.cos(a[0] * p) * math.cos(b[0] * p) * math.sin((b[1] - a[1]) * p / 2) ** 2)
    return 12742 * math.asin(math.sqrt(h))


def kv(tags):
    vs = [int(v) for v in re.findall(r'\d+', tags.get('voltage', '')) if int(v) >= 1000]
    return max(vs) // 1000 if vs else None


def substations(path):
    out = []
    for x in json.load(open(path, encoding='utf-8'))['elements']:
        t = x.get('tags', {})
        name = t.get('name', '')
        if not PLN.search(t.get('operator', '')) or SKIP.search(name):
            continue
        v = kv(t) or (275 if re.search(r'gitet', name, re.I) else None)
        if not v or v < MIN_KV:
            continue
        lat, lng = (x['lat'], x['lon']) if 'lat' in x else (x['center']['lat'], x['center']['lon'])
        out.append({'osm': '%s/%s' % (x['type'], x['id']), 'name': name or None, 'kv': v,
                    'lat': round(lat, 5), 'lng': round(lng, 5)})
    return out


def landmasses(path):
    """Polygons of the topojson's land as (component id, rings), where polygons that share an arc
    (neighbouring provinces) are one landmass."""
    topo = json.load(open(path, encoding='utf-8'))
    (sx, sy), (tx, ty) = topo['transform']['scale'], topo['transform']['translate']
    arcs = []
    for arc in topo['arcs']:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)

    def ring(ids):
        pts = []
        for i in ids:
            a = arcs[i] if i >= 0 else arcs[~i][::-1]
            pts.extend(a if not pts else a[1:])
        return pts

    polys = []
    for g in next(iter(topo['objects'].values()))['geometries']:
        for poly in (g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']] if g['type'] == 'Polygon' else []):
            polys.append(({i if i >= 0 else ~i for r in poly for i in r}, [ring(r) for r in poly]))
    parent = list(range(len(polys)))

    def root(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    owner = {}
    for k, (ids, _) in enumerate(polys):
        for i in ids:
            if i in owner:
                parent[root(k)] = root(owner[i])
            owner[i] = k
    # The coarse map draws some islands in pieces (Batam) and leaves gaps at bridged straits
    # (Batam-Rempang), so polygons closer than MERGE_KM are one landmass too.
    pts = [[pt for r in rings for pt in r] for _, rings in polys]
    box = [(min(y for _, y in q), max(y for _, y in q), min(x for x, _ in q), max(x for x, _ in q)) for q in pts]
    pad = MERGE_KM / 111.0
    for a in range(len(polys)):
        for b in range(a + 1, len(polys)):
            if root(a) == root(b) or box[a][0] > box[b][1] + pad or box[b][0] > box[a][1] + pad \
                    or box[a][2] > box[b][3] + pad or box[b][2] > box[a][3] + pad:
                continue
            if any(km((y1, x1), (y2, x2)) < MERGE_KM for x1, y1 in pts[a] for x2, y2 in pts[b]
                   if abs(y1 - y2) < pad and abs(x1 - x2) < pad):
                parent[root(a)] = root(b)
    return [(root(k), rings) for k, (_, rings) in enumerate(polys)]


def inside(rings, lng, lat):
    hit = False  # even-odd over the polygon's rings, so holes cancel out
    for r in rings:
        j = len(r) - 1
        for i in range(len(r)):
            (xi, yi), (xj, yj) = r[i], r[j]
            if (yi > lat) != (yj > lat) and lng < (xj - xi) * (lat - yi) / (yj - yi) + xi:
                hit = not hit
            j = i
    return hit


def landmass(land, p):
    """Landmass id of point p (lat, lng): the polygon it is in, else the nearest within SNAP_KM."""
    for comp, rings in land:
        if inside(rings, p[1], p[0]):
            return comp
    best = min(((km(p, (y, x)), comp) for comp, rings in land for r in rings for x, y in r[::3]))
    return best[1] if best[0] <= SNAP_KM else None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('osm')
    ap.add_argument('--land', required=True)
    ap.add_argument('--ruptl')
    a = ap.parse_args()

    subs = substations(a.osm)
    land = landmasses(a.land)
    for x in subs:
        x['land'] = landmass(land, (x['lat'], x['lng']))
    ruptl = {}
    if a.ruptl:
        for r in csv.DictReader(open(a.ruptl, encoding='utf-8-sig')):
            ruptl.setdefault(r['site_id'], []).append(r)
    sites = list(csv.DictReader(open(os.path.join(ROOT, 'data', 'parks.csv'), encoding='utf-8-sig')))

    out, rows = {}, []
    for s in sites:
        p = (float(s['lat']), float(s['lng']))
        home = landmass(land, p)
        same = [x for x in subs if home is not None and x['land'] == home]
        n = min(same or subs, key=lambda x: km(p, (x['lat'], x['lng'])))
        d = km(p, (n['lat'], n['lng']))
        # a site off the map (a small island such as Batam) only counts as crossing the sea to a
        # substation on a mapped landmass; two points off the map are taken to share an island
        cable = not same if home is not None else n['land'] is not None
        cost = None if cable else round(d * COST_PER_KM, 1)
        # medium-confidence RUPTL matches are kept only where RUPTL says it has no information
        matched = [r for r in ruptl.get(s['id'], []) if r.get('match_confidence') == 'high' or r.get('no_info') == '1']
        plans = [{k: r.get(k) or None for k in ('substation', 'voltage_kv', 'line_km', 'cod_year', 'plan', 'demand_mva')}
                 for r in matched if r.get('no_info') != '1']
        out[s['id']] = {'name': n['name'], 'kv': n['kv'], 'lat': n['lat'], 'lng': n['lng'], 'km': round(d, 1),
                        'sea': cable, 'costM': cost, 'ruptl': plans,
                        'ruptlNoInfo': any(r.get('no_info') == '1' for r in matched)}
        rows.append({'site_id': s['id'], 'substation': n['name'], 'osm_id': n['osm'], 'kv': n['kv'],
                     'distance_km': round(d, 1), 'sea_crossing': int(cable), 'line_cost_musd': cost,
                     'ruptl_substation': '; '.join(x['substation'] or '' for x in plans),
                     'ruptl_line_km': '; '.join(x['line_km'] or '' for x in plans)})
        print('  %-36s %5.1f km  %-34s %s kV%s' % (s['id'], d, n['name'], n['kv'],
                                                  '  (no substation on its landmass)' if cable else ''))

    js = ('/* GENERATED by scripts/build_substations.py. Do not edit by hand.\n'
          '   Nearest PLN substation (%d kV and above) to each site from OpenStreetMap (© OpenStreetMap\n'
          '   contributors, ODbL), straight-line km, and a rough connection cost (US$ m at %s m/km,\n'
          '   RUPTL average); ruptl = PLN\'s planned supply from RUPTL 2025-2034 Appendix E where it\n'
          '   names the site. */\n'
          'window.SUBSTATIONS = %s;\n') % (MIN_KV, COST_PER_KM, json.dumps(
              {'built': date.today().isoformat(), 'costPerKm': COST_PER_KM, 'sites': out,
               # every substation used, as [lat, lng, kV, name], for the region map
               'all': [[x['lat'], x['lng'], x['kv'], x['name']] for x in subs]},
              ensure_ascii=False, separators=(',', ':')))
    open(os.path.join(ROOT, 'assets', 'js', 'substations.js'), 'w', encoding='utf-8').write(js)
    with open(os.path.join(ROOT, 'data', 'site_substations.csv'), 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    with open(os.path.join(ROOT, 'data', 'osm_pln_substations.csv'), 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['osm', 'name', 'kv', 'lat', 'lng'], extrasaction='ignore')
        w.writeheader()
        w.writerows(subs)
    print('%d sites, %d PLN substations; %d need a sea crossing' % (len(out), len(subs), sum(v['sea'] for v in out.values())))


if __name__ == '__main__':
    main()
