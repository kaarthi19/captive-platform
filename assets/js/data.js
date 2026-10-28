/* Shared data for the platform.
   Sites (window.PARKS, assets/js/parks.js) are GENERATED from the Earthwise Institute captive
   coal database by scripts/build_parks.py: names, locations, sectors, owners and captive coal
   capacity are real. Readiness, transition cost, emissions intensity and energy mix are NOT yet
   available per site — they will come from the co-optimized generation & transmission expansion
   model (Julia/JuMP), joined through data/model_crosswalk.csv. Until then the facility page
   derives ILLUSTRATIVE values from capacity via placeholderResults() below. */

window.READY = { high: '#1d9e75', medium: '#ef9f27', low: '#fc4d50' };

/* Eight sectors (filters, tags). Map markers use only three colors — nickel, aluminium and a
   neutral for everything else — because more hues on a map can't be told apart reliably. */
window.SECTORS = {
  nickel:    { en: 'Nickel',                   id: 'Nikel' },
  aluminium: { en: 'Aluminium & alumina',      id: 'Aluminium & alumina' },
  pulp:      { en: 'Pulp & paper',             id: 'Pulp & kertas' },
  cement:    { en: 'Cement & building',        id: 'Semen & bahan bangunan' },
  chem:      { en: 'Chemicals & petrochem',    id: 'Kimia & petrokimia' },
  agro:      { en: 'Agro-processing & food',   id: 'Agroindustri & pangan' },
  metals:    { en: 'Mining & metals',          id: 'Pertambangan & logam' },
  mixed:     { en: 'Multi-sector & other',     id: 'Multisektor & lainnya' }
};
window.SECTOR_COLOR = { nickel: '#2a78d6', aluminium: '#eb6834', other: '#8a9197' };
window.sectorColor = function (s) { return window.SECTOR_COLOR[s] || window.SECTOR_COLOR.other; };
window.sectorName = function (s) { return window.SECTORS[s][window.CP_LANG === 'id' ? 'id' : 'en']; };

/* Total live captive coal (operating + construction + planned), MW. */
window.siteMW = function (f) { return f.op + f.con + f.plan; };

/* Stand-in for model results, scaled from capacity so the facility page has something to draw.
   Replace with per-site model outputs once they are joined in. */
window.placeholderResults = function (f) {
  var gw = window.siteMW(f) / 1000;
  return { cost: Math.max(0.1, Math.round(gw * 11) / 10), ei: 1.1, coal: 92, clean: 8 };
};

window.FAC = window.PARKS;

/* Grid hubs and proposed/existing transmission corridors for the Sulawesi region view
   (illustrative until the model's transmission results are loaded). */
window.HUBS = [
  { id:'palu',      name:'Palu',      lng:119.87, lat:-0.90 },
  { id:'gorontalo', name:'Gorontalo', lng:123.06, lat:0.54 },
  { id:'kendari',   name:'Kendari',   lng:122.51, lat:-3.97 },
  { id:'makassar',  name:'Makassar',  lng:119.43, lat:-5.14 }
];
window.CORRIDORS = [
  { from:'imip',                       hub:'palu',     mw:1400, cost:0.8, kv:275, status:'proposed' },
  { from:'sei',                        hub:'palu',     mw:500,  cost:0.4, kv:150, status:'proposed' },
  { from:'vdnip',                      hub:'kendari',  mw:900,  cost:0.5, kv:150, status:'proposed' },
  { from:'pomalaa-nickel',             hub:'kendari',  mw:300,  cost:0.2, kv:70,  status:'existing' },
  { from:'pcc',                        hub:'makassar', mw:150,  cost:0.1, kv:150, status:'proposed' }
];

window.getFac = function (id) {
  return window.FAC.find(function (f) { return f.id === id; }) || window.FAC[0];
};
