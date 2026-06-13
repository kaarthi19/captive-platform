# Indonesia Captive Power Decarbonization Platform — design prototype

An open-access, bilingual (English / Bahasa Indonesia) web prototype that provides
**facility-level decarbonization analysis** for Indonesia's 130+ industrial parks with
captive coal generation. Built for the Power Transformation Lab (UC San Diego), styled in
the [pwrlab.org](https://pwrlab.org) design family (charcoal `#272636` + coral `#fc4d50`),
evolved with a coal-vs-clean energy palette.

This is a **front-end design mockup**. All facility figures are illustrative placeholders —
production values would come from the co-optimized generation & transmission expansion model
(Julia/JuMP).

## Pages

| File | Screen |
|------|--------|
| `index.html` | National map — clickable markers for each park, filters (industry / region / readiness), facility popups |
| `facility.html` | Per-facility analysis — pathway comparison, energy mix, **live coal-price / grid-tariff sensitivity sliders**, cost breakdown, investment by stakeholder. Takes `?id=<facility>` |
| `region.html` | Sulawesi corridor — **interactive transmission map** (parks, grid hubs, proposed vs existing corridors), capacity/readiness chart, upgrades table |
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
  js/data.js          sample facility / corridor data
  js/i18n.js          EN/ID string table + toggle
  js/map.js           national map
  js/facility.js      facility page + sensitivity model
  js/region.js        regional transmission map
```

## Dependencies (via CDN)

[D3](https://d3js.org/) + [TopoJSON](https://github.com/topojson) for maps,
[Chart.js](https://www.chartjs.org/) for charts. Indonesia province topology from
[datamaps](https://github.com/markmarkoh/datamaps).
