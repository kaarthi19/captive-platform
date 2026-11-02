"""Join GARUDA run results to platform sites.

Reads finished GARUDA result folders (<scenario>_<island>_<year>_<case>/, as written by
captive-indonesia-2025's run_model.jl), keeps the runs that solved to within the gate, and writes:

  assets/js/results.js         window.GARUDA for the static site (region and facility pages)
  data/garuda_<year>_runs.csv  one row per island run: status, gap, cost, CO2, unserved demand
  data/garuda_<year>_sites.csv one row per site and run: capacity, new build, electricity supply

Model industrial-park nodes are joined to sites through data/model_crosswalk.csv (built by
build_parks.py); several nodes can roll up into one site, and nodes with no site are dropped.

Generation and demand are summed over the model's representative hours without period weights,
so the site figures are shares of park demand, not annual energy. The model reports unserved
demand per zone only; per site it is park demand minus what the park generated and imported.

Usage:
  python3 scripts/build_results.py RESULTS_DIR --inputs DIR [--year 2035] [--gate 0.01]

  RESULTS_DIR  folder holding the run folders (captive-indonesia-2025/results)
  --inputs     data_indonesia/<year>, for each island's ip_demand.csv and ip_demandheat.csv
  --gate       largest relative MIP gap a run may have and still be shown
"""
import argparse
import csv
import json
import os
import re
from collections import defaultdict
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# nocoal is left out for now (an extreme case, and in the model it still burns coal for process heat).
SCENARIOS = ['base', 'grid', 'captive', 'gridcaptive', 'highimportprice']
CASES = ['reference', 'clean']
ISLANDS = {'sulawesi': 'Sulawesi', 'north_maluku': 'Maluku', 'kalimantan': 'Kalimantan', 'sumatera': 'Sumatra',
           'jawa_bali': 'Java', 'nusa_tenggara': 'Nusa Tenggara', 'papua': 'Papua'}
TECH = {'coal_captive': 'coal', 'solar': 'solar', 'wind': 'wind', 'geothermal': 'geo', 'battery': 'bat'}
# The gap at the gate can print as 0.0100000x; allow for float noise.
GATE_SLACK = 1e-6
# Park grid import price (US$/MWh) and the highimportprice multiplier, as in the model's preflight.jl.
IMPORT_PRICE = 59.0
HIGH_IMPORT = 1.21
# Coal-price variants of the reference runs (input folder <island>_<variant>), the anchors of the
# facility coal-price slider, and the four pathways that have them. The slider is in $/t; captive
# coal is converted at 4,200 kcal/kg GAR, as on the website (facility.js MMBTU_PER_T).
COAL_VARIANTS = ['coal70', 'coal100']
# The coal price the slider starts at and the pathways' headline figures use: the input folder of
# that variant supplies the price (falls back to the island's own inputs if it is missing).
BASELINE_VARIANT = 'coal70'
ANCHOR_SCENARIOS = ['base', 'grid', 'captive', 'gridcaptive']
MMBTU_PER_T = 16.67

# cost_results.csv column -> results.js key (US$ million per year)
COSTS = [
    ('Fixed_Costs_Generation', 'gridGen'), ('Fixed_Costs_Transmission', 'gridTx'),
    ('Fixed_Costs_Storage', 'gridStor'), ('Variable_Costs_Grid', 'gridVar'), ('StartCostsGrid', 'gridStart'),
    ('Fixed_Costs_IP', 'parkGen'), ('Fixed_Costs_IP_Storage', 'parkStor'), ('Variable_Costs_IP', 'parkVar'),
    ('StartCostsIP', 'parkStart'), ('Grid_Import_Costs', 'imports'),
    ('NSE_Costs', 'nseGrid'), ('IPNSECosts', 'nseParkElec'), ('IPNSEHeatCosts', 'nseParkHeat')]


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return 0.0


def rows(path):
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        return []
    with open(path, newline='', encoding='utf-8-sig') as f:  # model inputs carry a byte-order mark
        return list(csv.DictReader(f))


def park_demand(path):
    """Sum of each demand_ip<N> column over the modelled hours, keyed by park index."""
    tot = defaultdict(float)
    for r in rows(path):
        for k, v in r.items():
            m = re.fullmatch(r'demand_ip(\d+)', k or '')
            if m:
                tot[int(m.group(1))] += num(v)
    return tot


def read_crosswalk():
    xw = defaultdict(dict)
    for r in rows(os.path.join(ROOT, 'data', 'model_crosswalk.csv')):
        xw[r['island']][int(r['ip'])] = {'site': r['site_id'], 'mw': num(r['model_mw'])}
    return xw


def read_run(folder):
    info = json.load(open(os.path.join(folder, 'run_info.json')))
    cost = (rows(os.path.join(folder, 'cost_results.csv')) or [{}])[0]
    co2 = (rows(os.path.join(folder, 'clean_energy_results.csv')) or [{}])[0]
    cfg = info.get('config', {})
    run = {
        'status': info.get('termination_status'),
        'gap': round(num(info.get('relative_gap')), 4),
        'commit': info.get('git_commit'),
        'finished': (info.get('finished_at') or '')[:10],
        'hours': round(num(info.get('wall_time_s')) / 3600, 1),
        'cost': round(num(cost.get('Total_Costs')) / 1000, 3),
        'costParts': {k: round(num(cost.get(c)), 1) for c, k in COSTS},
        'co2Grid': round(num(co2.get('CO2_Emissions_Grid')) / 1e6, 2),
        'co2Park': round(num(co2.get('CO2_Emissions_IP')) / 1e6, 2),
        'reShare': round(num(co2.get('Grid_REShare')), 3),
    }
    if cfg.get('CO235reduction'):
        run['co2ParkCap'] = round(0.65 * num(cfg.get('BAUCO2emissions')) / 1e6, 2)
    return run


def park_results(folder, dem_e, dem_h):
    """Per model park: capacity, new build, electricity supply shares, heat served."""
    cap = defaultdict(lambda: defaultdict(float))
    new = defaultdict(lambda: defaultdict(float))
    gen = defaultdict(lambda: defaultdict(float))
    for r in rows(os.path.join(folder, 'ip_generator_results.csv')):
        p, t = int(r['Industrial_Park']), TECH.get(r['technology'], r['technology'])
        cap[p][t] += num(r['Total_MW'])
        new[p][t] += max(0.0, num(r['Change_in_MW']))
        if t != 'bat':  # battery output is coal/solar energy shifted in time, not a source
            gen[p][t] += num(r['Electricity_GWh']) * 1000
    heat = defaultdict(float)
    for r in rows(os.path.join(folder, 'ip_heat_generator_results.csv')):
        heat[int(r['Industrial_Park'])] += num(r['GWh']) * 1000
    imp, peak = {}, {}
    for r in rows(os.path.join(folder, 'ip_import_results.csv')):
        imp[int(r['ID'])] = num(r['Total_Import_MWh'])
        peak[int(r['ID'])] = num(r['Peak_Import_MW'])
    out = {}
    for p in set(dem_e) | set(cap):
        out[p] = {'cap': dict(cap[p]), 'new': dict(new[p]), 'gen': dict(gen[p], grid=imp.get(p, 0.0)),
                  'heat': heat[p], 'demE': dem_e.get(p, 0.0), 'demH': dem_h.get(p, 0.0), 'peak': peak.get(p, 0.0)}
    return out


def annual_demand(path):
    """Annual park demand (MWh), weighting each representative hour by its period's Sub_Weights."""
    rs = rows(path)
    weights = [num(r['Sub_Weights']) for r in rs if r.get('Sub_Weights')]
    hours = int(num(rs[0]['Timesteps_per_Rep_Period'])) if rs else 1
    tot = defaultdict(float)
    for i, r in enumerate(rs):
        w = weights[i // hours] / hours
        for k, v in r.items():
            m = re.fullmatch(r'demand_ip(\d+)', k or '')
            if m:
                tot[int(m.group(1))] += w * num(v)
    return tot


def park_costs(folder, isl_inputs, run, parks, ann_e, ann_h, import_price):
    """What each park pays per year in one run, and the quantities the facility sliders scale.

    Park fixed costs (fixed O&M on all capacity, annualised investment on new build) are exact per
    unit. Operating costs, imports and start-ups come out of the model only as island totals, so
    each park gets its share by its own (unweighted) energy, then the shares are scaled to those
    totals. Battery energy capacity is not reported per park; the storage cost left after battery
    power is shared by new battery MW. Unserved-demand penalties are not a park cost and are left out.
    """
    units = {int(r['R_ID']): r for r in rows(os.path.join(isl_inputs, 'ip_generators.csv'))}
    fuels = {r['Fuel']: r for r in rows(os.path.join(isl_inputs, 'fuels_data.csv'))}
    parts = run['costParts']
    fixed, var, mmbtu, start_w, bat_mw, solar_inv, bat_inv = (defaultdict(float) for _ in range(7))
    for r in rows(os.path.join(folder, 'ip_generator_results.csv')):
        u = units[int(r['ID'])]
        # New-build candidates (New_Build = 1) start from nothing: their whole Total_MW is new build.
        # Their Start_MW / Change_in_MW are relative to a nominal size, not to existing capacity.
        p, mw = int(r['Industrial_Park']), num(r['Total_MW'])
        new = mw if num(u['New_Build']) == 1 else 0.0
        if u['technology'] == 'battery':
            bat_mw[p] += new
            bat_inv[p] += num(u['Inv_Cost_per_MWyr']) * new
        else:
            fixed[p] += num(u['Fixed_OM_Cost_per_MWyr']) * mw + num(u['Inv_Cost_per_MWyr']) * new
            if u['technology'] == 'solar':
                solar_inv[p] += num(u['Inv_Cost_per_MWyr']) * new
        mwh = num(r['Electricity_GWh']) * 1000
        fuel = fuels.get(u.get('Fuel'), {})
        var[p] += (num(u['Var_OM_Cost_per_MWh']) + num(fuel.get('Cost_per_MMBtu')) * num(u['Heat_Rate_MMBTU_per_MWh'])) * mwh
        if u.get('Fuel') == 'coal_captive':
            mmbtu[p] += num(u['Heat_Rate_MMBTU_per_MWh']) * mwh
        if u['technology'] == 'coal_captive':
            start_w[p] += mw
    for r in rows(os.path.join(folder, 'ip_heat_generator_results.csv')):
        u = units[int(r['ID'])]
        mwh = num(r['GWh']) * 1000
        fuel = fuels.get(u.get('Fuel'), {})
        var[int(r['Industrial_Park'])] += (num(u['Var_OM_Cost_per_MWh']) +
                                          num(fuel.get('Cost_per_MMBtu')) * num(u['Heat_Rate_MMBTU_per_MWh'])) * mwh
        if u.get('Fuel') == 'coal_captive':
            mmbtu[int(r['Industrial_Park'])] += num(u['Heat_Rate_MMBTU_per_MWh']) * mwh
    imp = {int(r['ID']): num(r['Total_Import_MWh']) for r in rows(os.path.join(folder, 'ip_import_results.csv'))}

    def scale(total_m, shares):
        s = sum(shares.values())
        return total_m * 1e6 / s if s else 0.0
    k_var = scale(parts['parkVar'], var)
    k_imp = scale(parts['imports'], imp)
    k_start = scale(parts['parkStart'], start_w)
    k_bat = scale(parts['parkStor'] - sum(bat_inv.values()) / 1e6, bat_mw)
    co2 = num(fuels.get('coal_captive', {}).get('CO2_content_tons_per_MMBtu'))
    out = {}
    for p in parks:
        dem = parks[p]['demE'] + parks[p]['demH']
        served = (min(parks[p]['demE'], sum(parks[p]['gen'].values())) + min(parks[p]['demH'], parks[p]['heat'])) / dem if dem else 0
        bat = bat_inv[p] + k_bat * bat_mw[p]
        out[p] = {
            'cost': fixed[p] + k_var * var[p] + k_imp * imp.get(p, 0.0) + k_start * start_w[p] + bat,
            'mwh': (ann_e.get(p, 0.0) + ann_h.get(p, 0.0)) * served,
            'dem': ann_e.get(p, 0.0) + ann_h.get(p, 0.0),
            # annual fuel burned (MMBtu, scaled like operating costs) and grid imports (MWh), for the
            # coal-price and tariff sliders
            'coal': mmbtu[p] * k_var,
            'imp': k_imp * imp.get(p, 0.0) / import_price if import_price else 0.0,
            # annualised solar and battery investment, for the solar + storage capex slider
            're': solar_inv[p] + bat,
        }
        out[p]['co2'] = out[p]['coal'] * co2
    return out


def site_path(pc, nodes):
    """A site's pathway figures in one run: park costs summed over the site's model parks."""
    agg = defaultdict(float)
    for p in nodes:
        for k, x in pc[p].items():
            agg[k] += x
    return {'lcoe': round(agg['cost'] / agg['mwh'], 2) if agg['mwh'] else None,
            'served': round(agg['mwh'] / agg['dem'], 3) if agg['dem'] else None,
            'mwh': round(agg['mwh']), 'cost': round(agg['cost']), 'co2': round(agg['co2']),
            'coal': round(agg['coal']), 'imp': round(agg['imp']), 're': round(agg['re'])}


def site_view(parks):
    """Roll one or more model parks up into a site's figures for one run."""
    cap, new, gen = defaultdict(float), defaultdict(float), defaultdict(float)
    heat = dem_e = dem_h = peak = 0.0
    for p in parks:
        for k, v in p['cap'].items():
            cap[k] += v
        for k, v in p['new'].items():
            new[k] += v
        for k, v in p['gen'].items():
            gen[k] += v
        heat += p['heat']
        dem_e += p['demE']
        dem_h += p['demH']
        peak += p['peak']
    supply = sum(gen.values())
    served = min(dem_e, supply)
    # Supply above demand is energy lost charging batteries; scale it back to what was served.
    scale = served / supply if supply else 0.0
    elec = {k: round(v * scale / dem_e, 3) for k, v in gen.items() if dem_e and v * scale / dem_e >= 0.0005}
    if dem_e:
        elec['unserved'] = round(1 - served / dem_e, 3)
    return {
        'cap': {k: round(v) for k, v in cap.items() if round(v)},
        'new': {k: round(v) for k, v in new.items() if round(v)},
        'elec': elec,
        'heatServed': round(min(heat, dem_h) / dem_h, 3) if dem_h else None,
        'importPeak': round(peak),
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('results')
    ap.add_argument('--inputs', required=True)
    ap.add_argument('--year', default='2035')
    ap.add_argument('--gate', type=float, default=0.01)
    ap.add_argument('--anchor-tag', default='', help='run_tag of the coal-price anchor runs (e.g. relaxuc)')
    a = ap.parse_args()

    xw = read_crosswalk()
    islands, sites, run_rows, site_rows = {}, {}, [], []
    for isl, region in ISLANDS.items():
        if isl not in xw:
            continue
        dem_e = park_demand(os.path.join(a.inputs, isl, 'ip_demand.csv'))
        dem_h = park_demand(os.path.join(a.inputs, isl, 'ip_demandheat.csv'))
        ann_e = annual_demand(os.path.join(a.inputs, isl, 'ip_demand.csv'))
        ann_h = annual_demand(os.path.join(a.inputs, isl, 'ip_demandheat.csv'))
        fuels = {r['Fuel']: r for r in rows(os.path.join(a.inputs, isl, 'fuels_data.csv'))}
        prices = {'coal': num(fuels.get('coal_captive', {}).get('Cost_per_MMBtu')), 'tariff': IMPORT_PRICE}
        base_fuels = os.path.join(a.inputs, '%s_%s' % (isl, BASELINE_VARIANT), 'fuels_data.csv')
        if a.anchor_tag and os.path.exists(base_fuels):
            prices['coal'] = num({r['Fuel']: r for r in rows(base_fuels)}['coal_captive']['Cost_per_MMBtu'])
        runs, missing = {}, {}
        for scen in SCENARIOS:
            for case in CASES:
                key = '%s/%s' % (scen, case)
                folder = os.path.join(a.results, '%s_%s_%s_%s' % (scen, isl, a.year, case))
                if not os.path.exists(os.path.join(folder, 'run_info.json')):
                    missing[key] = 'pending'
                    continue
                run = read_run(folder)
                if run['gap'] > a.gate + GATE_SLACK:
                    missing[key] = 'gap'
                    print('  excluded %s %s: %s, gap %.1f%%' % (isl, key, run['status'], 100 * run['gap']))
                    continue
                parks = park_results(folder, dem_e, dem_h)
                se, sh = sum(dem_e.values()), sum(dem_h.values())
                served_e = sum(min(p['demE'], sum(p['gen'].values())) for p in parks.values())
                served_h = sum(min(p['demH'], p['heat']) for p in parks.values())
                run['parkUnservedElec'] = round(1 - served_e / se, 3) if se else 0
                run['parkUnservedHeat'] = round(1 - served_h / sh, 3) if sh else 0
                runs[key] = run
                run_rows.append(dict({'island': isl, 'scenario': scen, 'case': case},
                                     **{k: v for k, v in run.items() if k != 'costParts'}, **run['costParts']))

                pc = {}
                if case == 'reference':
                    price = IMPORT_PRICE * (HIGH_IMPORT if scen == 'highimportprice' else 1)
                    pc = park_costs(folder, os.path.join(a.inputs, isl), run, parks, ann_e, ann_h, price)
                    parts = run['costParts']
                    model = sum(parts[k] for k in ('parkGen', 'parkStor', 'parkVar', 'parkStart', 'imports'))
                    print('  %s %s: park costs %.0f of %.0f M$/yr, park CO2 %.2f of %.2f Mt'
                          % (isl, key, sum(c['cost'] for c in pc.values()) / 1e6, model,
                             sum(c['co2'] for c in pc.values()) / 1e6, run['co2Park']))

                by_site = defaultdict(list)
                for p, res in parks.items():
                    node = xw[isl].get(p)
                    if not node or not node['site']:
                        continue
                    coal = res['cap'].get('coal', 0.0)
                    if case == 'reference' and scen == 'base' and abs(coal - node['mw']) > 1:
                        print('  warning: %s park %d has %.0f MW coal in the run, %.0f MW in the crosswalk'
                              % (isl, p, coal, node['mw']))
                    by_site[node['site']].append((p, res))
                for sid, lst in by_site.items():
                    s = sites.setdefault(sid, {'island': isl, 'nodes': sorted(p for p, _ in lst), 'runs': {}})
                    v = site_view([res for _, res in lst])
                    s['runs'][key] = v
                    if pc:
                        s.setdefault('path', {})[scen] = site_path(pc, [p for p, _ in lst])
                    site_rows.append(dict({'site_id': sid, 'island': isl, 'scenario': scen, 'case': case,
                                           'import_peak_mw': v['importPeak'], 'heat_served': v['heatServed']},
                                          **{'mw_' + k: x for k, x in v['cap'].items()},
                                          **{'new_mw_' + k: x for k, x in v['new'].items()},
                                          **{'elec_' + k: x for k, x in v['elec'].items()}))
        # Coal-price anchors: the same reference runs at other captive coal prices. With --anchor-tag
        # they are a separate set (e.g. relaxed UC, folders ending __<tag>) that includes the island's
        # own coal price, and the run at the baseline price (BASELINE_VARIANT) supplies the pathway's
        # headline figures, so every point on the coal slider comes from the same method.
        tag = '__' + a.anchor_tag if a.anchor_tag else ''
        site_nodes = defaultdict(list)
        for p, node in xw[isl].items():
            if node['site']:
                site_nodes[node['site']].append(p)
        for var in ([None] if tag else []) + COAL_VARIANTS:
            name = '%s_%s' % (isl, var) if var else isl
            vin = os.path.join(a.inputs, name)
            for scen in ANCHOR_SCENARIOS:
                folder = os.path.join(a.results, '%s_%s_%s_reference%s' % (scen, name, a.year, tag))
                if not os.path.exists(os.path.join(folder, 'run_info.json')):
                    continue
                run = read_run(folder)
                if run['gap'] > a.gate + GATE_SLACK:
                    print('  excluded %s %s/%s: %s, gap %.1f%%' % (isl, scen, var, run['status'], 100 * run['gap']))
                    continue
                vf = {r['Fuel']: r for r in rows(os.path.join(vin, 'fuels_data.csv'))}
                tonne = round(num(vf['coal_captive']['Cost_per_MMBtu']) * MMBTU_PER_T, 1)
                parks = park_results(folder, dem_e, dem_h)
                pc = park_costs(folder, vin, run, parks, ann_e, ann_h, IMPORT_PRICE)
                parts = run['costParts']
                model = sum(parts[k] for k in ('parkGen', 'parkStor', 'parkVar', 'parkStart', 'imports'))
                print('  %s %s at $%.0f/t coal%s: park costs %.0f of %.0f M$/yr, park CO2 %.2f of %.2f Mt'
                      % (isl, scen, tonne, tag, sum(c['cost'] for c in pc.values()) / 1e6, model,
                         sum(c['co2'] for c in pc.values()) / 1e6, run['co2Park']))
                for sid, nodes in site_nodes.items():
                    path = sites.get(sid, {}).get('path', {}).get(scen)
                    if path and all(p in pc for p in nodes):
                        mix = site_view([parks[p] for p in nodes if p in parks])['elec']
                        path.setdefault('anchors', []).append(dict(site_path(pc, nodes), t=tonne, mix=mix))
        own = round(prices['coal'] * MMBTU_PER_T, 1)
        for sid in site_nodes:
            for scen, path in sites.get(sid, {}).get('path', {}).items():
                if not path.get('anchors'):
                    continue
                fields = ('lcoe', 'served', 'mwh', 'cost', 'co2', 'coal', 'imp', 're', 'mix')
                if not any(x['t'] == own for x in path['anchors']):
                    path['anchors'].append(dict({k: path.get(k) for k in fields}, t=own))
                path['anchors'].sort(key=lambda x: x['t'])
                path.update({k: v for k, v in next(x for x in path['anchors'] if x['t'] == own).items() if k in fields})

        if runs:
            islands[isl] = {'region': region, 'runs': runs, 'missing': missing, 'prices': prices}

    js = ('/* GENERATED by scripts/build_results.py from GARUDA %s results. Do not edit by hand.\n'
          '   Only runs within a %.0f%% MIP gap are included; "missing" lists the rest (pending or gap).\n'
          '   Costs are US$ bn/yr (costParts US$ m/yr), CO2 Mt/yr. Site elec values are shares of the\n'
          '   park electricity demand met by each source; cap and new are MW. */\n'
          'window.GARUDA = %s;\n') % (a.year, 100 * a.gate, json.dumps(
              {'year': int(a.year), 'built': date.today().isoformat(), 'gate': a.gate,
               'scenarios': SCENARIOS, 'islands': islands, 'sites': sites}, ensure_ascii=False, indent=1))
    with open(os.path.join(ROOT, 'assets', 'js', 'results.js'), 'w', encoding='utf-8') as f:
        f.write(js)

    for name, data in (('runs', run_rows), ('sites', site_rows)):
        fields = []
        for r in data:
            fields += [k for k in r if k not in fields]
        with open(os.path.join(ROOT, 'data', 'garuda_%s_%s.csv' % (a.year, name)), 'w', newline='',
                  encoding='utf-8') as f:
            w = csv.DictWriter(f, fieldnames=fields)
            w.writeheader()
            w.writerows(data)

    for isl, d in islands.items():
        print('%s: %d runs shown, %d missing (%s)' % (isl, len(d['runs']), len(d['missing']),
                                                       ', '.join(sorted(set(d['missing'].values())))))
    print('%d sites with results' % len(sites))


if __name__ == '__main__':
    main()
