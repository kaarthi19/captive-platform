# CITRA — Captive Industry Transition Roadmap Atlas

CITRA is an open-access, multilingual (English / Bahasa Indonesia / 简体中文) web prototype that provides
**facility-level decarbonization analysis** for Indonesia's captive coal fleet: 86 sites
(27 industrial parks and 59 standalone captive plants) with captive coal that is operating,
under construction or planned. Built for the Power Transformation Lab (UC San Diego), styled in
the [pwrlab.org](https://pwrlab.org) design family (charcoal `#272636` + coral `#fc4d50`),
evolved with a coal-vs-clean energy palette.

Site data (names, locations, sectors, owners, captive coal units by status) is real and comes
from the [Earthwise Institute](https://earthwise.institute) Indonesian Power Summary Database.
Pathway costs, the electricity mix, the cost breakdown, the coal-price, tariff and capex sliders,
and the corridors between provinces come from 2035 runs of [GARUDA](https://github.com/Power-Lab/garuda)
(Grid And Renewable Utilization & Deployment Analysis), the lab's co-optimized generation &
transmission expansion model (Julia/JuMP), for all 86 sites (`scripts/build_results.py`).
Nearest PLN substations come from
OpenStreetMap and PLN's planned connections from RUPTL 2025–2034 (`scripts/build_substations.py`).

## Pages

| File | Screen |
|------|--------|
| `index.html` | National map — a marker per site, filters (sector / region / status), facility popups |
| `facility.html` | Per-facility analysis — pathway comparison, energy mix, **live coal-price / grid-tariff sensitivity sliders**, cost breakdown by component. Takes `?id=<facility>` |
| `ownership.html` | Per-site ownership — ultimate owners weighted by share of capacity (linked to checked company websites), ownership profile, operator → owner → parent → ultimate-owner chain per plant. Takes `?id=<site>` |
| `financing.html` | Per-site financing — disclosed loans (amounts, lenders and their countries, lender types, structure, currency, borrower, sources), lenders across the site's loans. Takes `?id=<site>` |
| `region.html` | Per-region grid map — sites, PLN substations (150 kV and above) and each site's link to its nearest one, corridors between provinces marked where GARUDA upgrades them (layer toggles), operating capacity by site, corridor table. Takes `?r=<region>` |
| `methodology.html` | Methods, data sources, how to cite, licence |
| `about.html` | Project, team, data sources, partners |
| `contact.html` | Contact |

The **EN / ID / 中文 toggle** (top-right) switches the interface language; the choice persists in
`localStorage`. Strings live in `assets/js/i18n.js`: `data-i18n` swaps an element's text,
`data-i18n-html` swaps long passages with markup (the page's own HTML is the English), and any
key missing from a language falls back to English.

## Run it

It's a static site. Any HTTP server works (the map needs network access to load basemap
topology from a CDN):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Structure

```
index.html  facility.html  region.html  ownership.html  financing.html
methodology.html  about.html  contact.html
assets/
  css/styles.css      design system
  js/parks.js         GENERATED site summaries (scripts/build_parks.py)
  js/site-details.js  GENERATED per-site units, ownership, financing, projects
  js/results.js       GENERATED GARUDA pathways and corridors (scripts/build_results.py)
  js/substations.js   GENERATED nearest PLN substations (scripts/build_substations.py)
  js/data.js          sectors, regions, illustrative fallback figures
  js/i18n.js          EN/ID/ZH string table + toggle
  js/map.js           national map
  js/home.js          homepage section reveals
  js/facility.js      facility page + sensitivity model
  js/region.js        regional grid map
  js/cite.js          "Cite this platform" (methodology page)
```

## Site data

`assets/js/parks.js`, `assets/js/site-details.js`, `data/parks.csv` and
`data/model_crosswalk.csv` are generated from the Earthwise unit-level workbook (plus the
optional extended-dimensions workbook, which adds the industrial projects each site powers). Rebuild them after an Earthwise update or a change to GARUDA's
industrial-park inputs:

```bash
python3 scripts/build_parks.py path/to/Earthwise-Institute_*_Indonesia-Captive-Coal-Database_*.xlsx \
  --extended path/to/Earthwise-Institute_*_Captive-Coal-Extended-Dims_*.xlsx
```

Needs `openpyxl`. `--model-data` points at the GARUDA inputs whose park nodes the sites are
matched to: the current data use the 2035 new-park inputs (`data_indonesia/2035`, island folders
only, not the `_coal70`/`_coal100` variants). The default is a sibling checkout of `garuda`
(`data_indonesia/captive/2030`).

- Units are grouped into one site per named industrial park / complex, plus one per standalone
  plant. Cancelled, shelved, retired, closed and status-unknown units are dropped.
- Each Earthwise commodity maps to one of eight sectors (`SECTOR` in the script).
- `data/earthwise_corrections.csv` fixes confirmed errors in the source rows.
- `data/owners.csv` maps each Earthwise ultimate-owner spelling to one company group, with its
  headquarters country and official website. Only URLs that were opened and confirmed as the
  company's own site are linked; leave `url` blank rather than guess.
- `data/lenders.csv` merges lender spellings that are unmistakably the same institution (OCBC /
  OCBC Bank / Overseas Chinese Banking Corp) and sets each one's HQ country. Subsidiaries such as
  OCBC NISP or CIMB Niaga stay separate.
- `data/model_crosswalk.csv` links each GARUDA node (`island:index`) to a site. Matches are by
  nearest site within 15 km; `data/crosswalk_overrides.csv` pins the ones that need judgement,
  with the reason. Model outputs will join to sites through this file.

Data credit: Earthwise Institute. *Indonesian Power Summary Database.* Earthwise Institute, 2026.

## Model results

`assets/js/results.js` and the `data/garuda_2035_*.csv` tables come from GARUDA 2035 runs of
[captive-indonesia-2025](https://github.com/Power-Lab/captive-indonesia-2025), relaxed unit
commitment, four scenarios (`base`, `grid`, `captive`, `gridcaptive`) on each of seven islands at
three captive coal prices ($64.1, $70 and $100/t; $70 is the site's baseline). The inputs add park
nodes for the 35 sites that were not yet in the model (branch `feat/new-park-nodes`, commit
`bd35824`, which includes the two-way line-flow fix on `fix/d1-d4-d11`). The runs are on the lab's
pwrlab server under `captive-runs/new_nodes/repo/results/*__relaxuc_newnodes`; Nusa Tenggara has
no new nodes, so its runs are `captive-indonesia-2025/results/*nusa_tenggara*__relaxuc`, used
under the same tag. To rebuild, with the runs and inputs copied into `runs/` and `inputs/`:

```bash
python3 scripts/build_results.py runs --inputs inputs --anchor-tag relaxuc_newnodes
```

It checks that every run solved, prints each island's park costs and CO₂ against the model totals,
and writes:

- `assets/js/results.js`: what the facility and region pages read
- `data/garuda_2035_pathways.csv`: each site's pathway at each coal price ($/MWh, cost, CO₂, mix)
- `data/garuda_2035_corridors.csv`: each corridor's existing, used and added capacity
- `data/garuda_2035_runs.csv` and `data/garuda_2035_sites.csv`: island runs and site rows

Sites join to model nodes through `data/model_crosswalk.csv`. A few co-located sites share one
node (listed in `data/crosswalk_overrides.csv`); each shows the node's combined result, and the
facility page says so.

## Grid connections

`assets/js/substations.js`, `data/site_substations.csv` and `data/osm_pln_substations.csv` come from
an OpenStreetMap Overpass extract of `power=substation` in Indonesia, the
[datamaps](https://github.com/markmarkoh/datamaps) `idn.topo.json` basemap (for the sea-crossing
test) and `data/ruptl_connections.csv` (PLN's planned connections, read from RUPTL 2025–2034
Appendix E):

```bash
python3 scripts/build_substations.py substations.json --land idn.topo.json \
  --ruptl data/ruptl_connections.csv
```

## Hosting and licence

The site is served by GitHub Pages from `main`. Results, figures and data files are under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (see `LICENSE`); OpenStreetMap data
are under the ODbL, and Earthwise Institute records should be credited to Earthwise.

## Dependencies (via CDN)

[D3](https://d3js.org/) + [TopoJSON](https://github.com/topojson) for maps,
[Chart.js](https://www.chartjs.org/) for charts. Indonesia province topology from
[datamaps](https://github.com/markmarkoh/datamaps).
