# CITRA — Captive Industry Transition Roadmap Atlas

CITRA is an open-access atlas of Indonesia's captive coal fleet, the coal plants that power
industrial parks and plants directly rather than through the PLN grid. It covers 86 sites
(27 industrial parks and 59 standalone plants) with captive coal that is operating, under
construction or planned, and shows for each one what it would cost to move off coal by 2035.
It is available in English, Bahasa Indonesia and 简体中文.

CITRA is published by the [Power Transformation Lab](https://pwrlab.org), University of
California San Diego.

## What's in it

- **National map**: every site, filterable by sector, region and status, with a summary card for
  each.
- **Facility pages**: for each site, the 2035 cost per MWh of four pathways (business as
  usual on existing coal, grid connection to PLN, on-site solar plus storage, and a hybrid of
  the two), the energy mix and
  cost breakdown of each, and sliders for the coal price, grid tariff and solar-plus-storage cost.
  Also the site's coal units, nearest PLN substation and any connection PLN has planned for it.
- **Ownership and financing**: who owns each site's coal units, up to the ultimate owner, and
  the disclosed loans behind them.
- **Regional grid maps**: sites, PLN substations and the transmission corridors between
  provinces, marked where the model needs more capacity.
- **Methodology**: how the results are produced, the data sources, and how to cite CITRA.

## Data sources

- **Sites, units, ownership and financing**: [Earthwise Institute](https://earthwise.institute),
  *Indonesian Power Summary Database* (2026).
- **Pathways, costs and transmission corridors**: 2035 runs of
  [GARUDA](https://github.com/Power-Lab/garuda) (Grid And Renewable Utilization & Deployment
  Analysis), the lab's open-source generation and transmission expansion model, using the
  [captive-indonesia-2025](https://github.com/Power-Lab/captive-indonesia-2025) study inputs.
  Each site is a node in the model, run at captive coal prices of $64, $70 and $100 per tonne.
- **PLN substations**: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
- **PLN's planned connections**: RUPTL 2025–2034 (PLN's electricity supply business plan),
  Appendix E.

## Data files

The tables behind the site are in [`data/`](data):

| File | Contents |
|---|---|
| `parks.csv` | The 86 sites: location, sector, captive coal capacity by status, main owner |
| `garuda_2035_pathways.csv` | Each site's four pathways at each coal price: $/MWh, cost, CO₂, energy mix |
| `garuda_2035_corridors.csv` | Transmission corridors between provinces: existing, used and added capacity |
| `site_substations.csv` | Each site's nearest PLN substation (150 kV and above), distance and rough connection cost |
| `ruptl_connections.csv` | Connections PLN plans for these sites in RUPTL 2025–2034 |
| `model_crosswalk.csv` | Which GARUDA model node each site is |

## How to cite

Power Transformation Lab, University of California San Diego. (2026). *CITRA: Captive Industry
Transition Roadmap Atlas* [Data set].

The methodology page has the full citation with version date, and a BibTeX entry.

## Licence

CITRA's results, figures and data files are available under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): you may reuse and adapt them for any
purpose, with credit to the Power Transformation Lab and CITRA. OpenStreetMap data are under the
[ODbL](https://opendatacommons.org/licenses/odbl/), and Earthwise Institute records should be
credited to Earthwise. See [`LICENSE`](LICENSE).

## Contact

Questions, corrections and requests for analysis: see the site's Contact page.

---

## For developers

CITRA is a static site (HTML, CSS and JavaScript, with [D3](https://d3js.org/),
[TopoJSON](https://github.com/topojson) and [Chart.js](https://www.chartjs.org/) from a CDN). To
run it locally:

```bash
python3 -m http.server 8000
```

then open http://localhost:8000. Interface text for all three languages is in
`assets/js/i18n.js`.

The data files and the generated `assets/js/parks.js`, `site-details.js`, `results.js` and
`substations.js` are built by three scripts in `scripts/`:

- **`build_parks.py`**: sites from the Earthwise workbooks, matched to GARUDA's park nodes
  (`--model-data`, the study's `data_indonesia/2035` island folders). Needs `openpyxl`.
  Corrections to the source rows are in `data/earthwise_corrections.csv`, owner and lender name
  merges in `data/owners.csv` and `data/lenders.csv`, and matches that need judgement in
  `data/crosswalk_overrides.csv`.

  ```bash
  python3 scripts/build_parks.py Earthwise-Institute_*_Indonesia-Captive-Coal-Database_*.xlsx \
    --extended Earthwise-Institute_*_Captive-Coal-Extended-Dims_*.xlsx --model-data inputs
  ```

- **`build_results.py`**: pathways and corridors from GARUDA run folders. It checks that every run
  solved and that each island's park costs and CO₂ add up to the model's totals.

  ```bash
  python3 scripts/build_results.py runs --inputs inputs --anchor-tag relaxuc_newnodes
  ```

- **`build_substations.py`**: nearest substations from an OpenStreetMap Overpass extract of
  `power=substation`, with the [datamaps](https://github.com/markmarkoh/datamaps) basemap for
  the sea-crossing test.

  ```bash
  python3 scripts/build_substations.py substations.json --land idn.topo.json \
    --ruptl data/ruptl_connections.csv
  ```
