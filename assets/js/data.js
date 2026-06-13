/* Shared sample data for the prototype.
   NOTE: facility names/locations are real industrial parks, but all capacity, emissions,
   cost and readiness figures are ILLUSTRATIVE placeholders — production values come from
   the co-optimized generation & transmission expansion model (Julia/JuMP). */

window.READY = { high: '#1d9e75', medium: '#ef9f27', low: '#fc4d50' };
window.IND_NAME = { nickel: 'Nickel smelting', aluminum: 'Aluminum refining', pulp: 'Pulp & paper' };

window.FAC = [
  { id:'imip',     name:'IMIP — Morowali',              prov:'Central Sulawesi', region:'Sulawesi',  ind:'nickel',   cap:3700, ei:1.9, cost:4.2, ready:'high',   lng:121.95, lat:-2.84, coal:92, clean:8 },
  { id:'iwip',     name:'IWIP — Weda Bay',              prov:'North Maluku',     region:'Maluku',    ind:'nickel',   cap:3400, ei:2.0, cost:3.9, ready:'medium', lng:127.95, lat:0.50,  coal:95, clean:5 },
  { id:'gni',      name:'GNI — Gunbuster',              prov:'Central Sulawesi', region:'Sulawesi',  ind:'nickel',   cap:1900, ei:2.1, cost:2.3, ready:'medium', lng:121.30, lat:-0.72, coal:97, clean:3 },
  { id:'vdni',     name:'VDNI/OSS — Konawe',            prov:'SE Sulawesi',      region:'Sulawesi',  ind:'nickel',   cap:1500, ei:2.0, cost:1.8, ready:'high',   lng:122.30, lat:-3.95, coal:90, clean:10 },
  { id:'obi',      name:'Harita — Obi Island',          prov:'North Maluku',     region:'Maluku',    ind:'nickel',   cap:1200, ei:1.8, cost:1.4, ready:'high',   lng:127.50, lat:-1.50, coal:88, clean:12 },
  { id:'ketapang', name:'Well Harvest — Ketapang',      prov:'West Kalimantan',  region:'Kalimantan',ind:'aluminum', cap:700,  ei:1.5, cost:0.9, ready:'medium', lng:110.20, lat:-1.85, coal:85, clean:15 },
  { id:'galang',   name:'Bintan Alumina — Galang Batang',prov:'Riau Islands',    region:'Sumatra',   ind:'aluminum', cap:1000, ei:1.6, cost:1.2, ready:'low',    lng:104.60, lat:0.90,  coal:93, clean:7 },
  { id:'oki',      name:'OKI Pulp & Paper',             prov:'South Sumatra',    region:'Sumatra',   ind:'pulp',     cap:500,  ei:1.1, cost:0.6, ready:'high',   lng:104.90, lat:-3.20, coal:70, clean:30 },
  { id:'april',    name:'APRIL — Pangkalan Kerinci',    prov:'Riau',             region:'Sumatra',   ind:'pulp',     cap:600,  ei:1.0, cost:0.7, ready:'medium', lng:101.90, lat:0.38,  coal:72, clean:28 },
  { id:'kolaka',   name:'Antam — Kolaka',               prov:'SE Sulawesi',      region:'Sulawesi',  ind:'nickel',   cap:400,  ei:1.9, cost:0.5, ready:'low',    lng:121.60, lat:-4.05, coal:96, clean:4 },
  { id:'bantaeng', name:'Huadi — Bantaeng',             prov:'South Sulawesi',   region:'Sulawesi',  ind:'nickel',   cap:600,  ei:2.0, cost:0.8, ready:'medium', lng:119.95, lat:-5.50, coal:94, clean:6 },
  { id:'sulut',    name:'Megah Surya — N. Sulawesi',    prov:'North Sulawesi',   region:'Sulawesi',  ind:'nickel',   cap:300,  ei:2.1, cost:0.4, ready:'low',    lng:124.80, lat:0.60,  coal:98, clean:2 }
];

/* Grid hubs and proposed/existing transmission corridors for the Sulawesi region view. */
window.HUBS = [
  { id:'palu',      name:'Palu',      lng:119.87, lat:-0.90 },
  { id:'gorontalo', name:'Gorontalo', lng:123.06, lat:0.54 },
  { id:'kendari',   name:'Kendari',   lng:122.51, lat:-3.97 },
  { id:'makassar',  name:'Makassar',  lng:119.43, lat:-5.14 }
];
window.CORRIDORS = [
  { from:'imip',     hub:'palu',      mw:1400, cost:0.8, kv:275, status:'proposed' },
  { from:'gni',      hub:'gorontalo', mw:500,  cost:0.4, kv:150, status:'proposed' },
  { from:'vdni',     hub:'kendari',   mw:900,  cost:0.5, kv:150, status:'proposed' },
  { from:'kolaka',   hub:'kendari',   mw:300,  cost:0.2, kv:70,  status:'existing' },
  { from:'bantaeng', hub:'makassar',  mw:600,  cost:0.4, kv:150, status:'proposed' },
  { from:'sulut',    hub:'gorontalo', mw:200,  cost:0.2, kv:70,  status:'existing' }
];

window.getFac = function (id) {
  return window.FAC.find(f => f.id === id) || window.FAC[0];
};
