# Indonesia Captive Power Decarbonization Platform — design prototype

An open-access, bilingual (English / Bahasa Indonesia) web prototype that provides
**facility-level decarbonization analysis** for Indonesia's captive coal fleet: 86 sites
(27 industrial parks and 59 standalone captive plants) with captive coal that is operating,
under construction or planned. Built for the Power Transformation Lab (UC San Diego), styled in
the [pwrlab.org](https://pwrlab.org) design family (charcoal `#272636` + coral `#fc4d50`),
evolved with a coal-vs-clean energy palette.

Site data (names, locations, sectors, owners, captive coal units by status) is real and comes
from the [Earthwise Institute](https://earthwise.institute) Indonesian Power Summary Database.
Readiness, pathway costs, energy mix and transmission corridors are still **illustrative
placeholders** until the co-optimized generation & transmission expansion model
([captive-indonesia-2025](https://github.com/Power-Lab/captive-indonesia-2025), Julia/JuMP)
results are loaded.

## Pages

| File | Screen |
|------|--------|
| `index.html` | National map — a marker per site, filters (sector / region / status), facility popups |
| `facility.html` | Per-facility analysis — pathway comparison, energy mix, **live coal-price / grid-tariff sensitivity sliders**, cost breakdown, investment by stakeholder. Takes `?id=<facility>` |
| `region.html` | Sulawesi corridor — **interactive transmission map** (sites, grid hubs, proposed vs existing corridors), capacity-by-site chart, upgrades table |
| `about.html` | Project, team, data sources, partners |

The **EN / ID toggle** (top-right) switches the interface language; the choice persists in
`localStorage`.

## Run it

It's a static site. Any HTTP server works (the map needs network access to load basemap
topology from a CDN):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Structure

```
index.html  facility.html  region.html  about.html
assets/
  css/styles.css      design system
  js/parks.js         GENERATED site summaries (scripts/build_parks.py)
  js/site-details.js  GENERATED per-site units, ownership, financing, projects
  js/data.js          sectors, placeholder model results, corridor data
  js/i18n.js          EN/ID string table + toggle
  js/map.js           national map
  js/facility.js      facility page + sensitivity model
  js/region.js        regional transmission map
```

## Site data

`assets/js/parks.js`, `assets/js/site-details.js`, `data/parks.csv` and
`data/model_crosswalk.csv` are generated from the Earthwise unit-level workbook (plus the
optional extended-dimensions workbook, which adds the industrial projects each site powers). Rebuild them after an Earthwise update or a change to the model's
industrial-park inputs:

```bash
python3 scripts/build_parks.py path/to/Earthwise-Institute_*_Indonesia-Captive-Coal-Database_*.xlsx \
  --extended path/to/Earthwise-Institute_*_Captive-Coal-Extended-Dims_*.xlsx
```

Needs `openpyxl`. By default it reads model nodes from a sibling checkout of
`captive-indonesia-2025` (`--model-data` to point elsewhere).

- Units are grouped into one site per named industrial park / complex, plus one per standalone
  plant. Cancelled, shelved, retired, closed and status-unknown units are dropped.
- Each Earthwise commodity maps to one of eight sectors (`SECTOR` in the script).
- `data/earthwise_corrections.csv` fixes confirmed errors in the source rows.
- `data/model_crosswalk.csv` links each model node (`island:index`) to a site. Matches are by
  nearest site within 15 km; `data/crosswalk_overrides.csv` pins the ones that need judgement,
  with the reason. Model outputs will join to sites through this file.

Data credit: Earthwise Institute. *Indonesian Power Summary Database.* Earthwise Institute, 2026.

## Dependencies (via CDN)

[D3](https://d3js.org/) + [TopoJSON](https://github.com/topojson) for maps,
[Chart.js](https://www.chartjs.org/) for charts. Indonesia province topology from
[datamaps](https://github.com/markmarkoh/datamaps).
