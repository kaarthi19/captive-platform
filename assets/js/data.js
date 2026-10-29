/* Shared data for the platform.
   Sites (window.PARKS, assets/js/parks.js) are GENERATED from the Earthwise Institute captive
   coal database by scripts/build_parks.py: names, locations, sectors, owners and captive coal
   capacity are real. Readiness, transition cost, emissions intensity and energy mix are NOT yet
   available per site — they will come from the co-optimized generation & transmission expansion
   model, GARUDA (Julia/JuMP), joined through data/model_crosswalk.csv. Until then the facility page
   derives ILLUSTRATIVE values from capacity via placeholderResults() below. */

window.READY = { high: '#1d9e75', medium: '#ef9f27', low: '#fc4d50' };

/* Eight sectors (filters, tags). Map markers use only three colors — nickel, aluminium and a
   neutral for everything else — because more hues on a map can't be told apart reliably. */
window.SECTORS = {
  nickel:    { en: 'Nickel',                   id: 'Nikel', zh: '镍' },
  aluminium: { en: 'Aluminium & alumina',      id: 'Aluminium & alumina', zh: '铝和氧化铝' },
  pulp:      { en: 'Pulp & paper',             id: 'Pulp & kertas', zh: '纸浆和造纸' },
  cement:    { en: 'Cement & building',        id: 'Semen & bahan bangunan', zh: '水泥和建材' },
  chem:      { en: 'Chemicals & petrochem',    id: 'Kimia & petrokimia', zh: '化工和石化' },
  agro:      { en: 'Agro-processing & food',   id: 'Agroindustri & pangan', zh: '农产品加工和食品' },
  metals:    { en: 'Mining & metals',          id: 'Pertambangan & logam', zh: '采矿和金属' },
  mixed:     { en: 'Multi-sector & other',     id: 'Multisektor & lainnya', zh: '多行业及其他' }
};
window.SECTOR_COLOR = { nickel: '#2a78d6', aluminium: '#eb6834', other: '#8a9197' };
window.sectorColor = function (s) { return window.SECTOR_COLOR[s] || window.SECTOR_COLOR.other; };
window.sectorName = function (s) { return window.SECTORS[s][window.CP_LANG] || window.SECTORS[s].en; };

/* Total live captive coal (operating + construction + planned), MW. */
window.siteMW = function (f) { return f.op + f.con + f.plan; };

/* Stand-in for GARUDA results, scaled from capacity so the facility page has something to draw.
   Replace with per-site GARUDA outputs once they are joined in. */
window.placeholderResults = function (f) {
  var gw = window.siteMW(f) / 1000;
  return { cost: Math.max(0.1, Math.round(gw * 11) / 10), ei: 1.1, coal: 92, clean: 8 };
};

window.FAC = window.PARKS;

/* Regions for the region page: platform region key, display names, and the province names used
   by the Indonesia basemap (datamaps topology; Kalimantan Utara is still part of Kalimantan Timur). */
window.REGIONS = [
  { key: 'Sulawesi', en: 'Sulawesi', id: 'Sulawesi', zh: '苏拉威西',
    provinces: ['Sulawesi Utara', 'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tenggara'] },
  { key: 'Maluku', en: 'North Maluku', id: 'Maluku Utara', zh: '北马鲁古', provinces: ['Maluku Utara', 'Maluku'] },
  { key: 'Kalimantan', en: 'Kalimantan', id: 'Kalimantan', zh: '加里曼丹',
    provinces: ['Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur'] },
  { key: 'Sumatra', en: 'Sumatra', id: 'Sumatra', zh: '苏门答腊',
    provinces: ['Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi', 'Bengkulu',
                'Sumatera Selatan', 'Bangka-Belitung', 'Lampung'] },
  { key: 'Java', en: 'Java and Bali', id: 'Jawa dan Bali', zh: '爪哇和巴厘',
    provinces: ['Banten', 'Jakarta Raya', 'Jawa Barat', 'Jawa Tengah', 'Yogyakarta', 'Jawa Timur', 'Bali'] },
  { key: 'Nusa Tenggara', en: 'Nusa Tenggara', id: 'Nusa Tenggara', zh: '努沙登加拉', provinces: ['Nusa Tenggara Barat', 'Nusa Tenggara Timur'] },
  { key: 'Papua', en: 'Papua', id: 'Papua', zh: '巴布亚', provinces: ['Irian Jaya Barat', 'Papua'] }
];
window.regionName = function (r) { return r[window.CP_LANG] || r.en; };

/* Grid hubs and proposed/existing transmission corridors for the Sulawesi region view
   (illustrative until GARUDA's transmission results are loaded). */
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

window.esc = function (v) {
  return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
};

/* Owner name, linked to the company's own website when data/owners.csv has a checked URL. */
window.ownerLink = function (o) {
  return o.url
    ? '<a href="' + window.esc(o.url) + '" target="_blank" rel="noopener">' + window.esc(o.name) + ' ↗</a>'
    : window.esc(o.name);
};

/* Site card for the maps. Hover (or keyboard focus) opens it; it stays open while the pointer is
   on the card so its links can be used, and closes shortly after the pointer leaves. Clicking a
   marker pins it (this is also how touch devices open it) until the close button or the map
   background is clicked. */
window.siteCardHtml = function (d) {
  var t = window.tr, esc = window.esc, q = encodeURIComponent(d.id);
  var mw = function (v) { return Math.round(v).toLocaleString() + ' MW'; };
  var place = d.prov + (d.regency ? ' · ' + d.regency : '');
  return '<button class="x" aria-label="Close">&times;</button>' +
    '<div style="font-weight:600;font-size:14px;margin-bottom:1px;padding-right:16px">' + esc(d.name) + '</div>' +
    '<div style="font-size:11.5px;color:#6b6a78;margin-bottom:8px">' + esc(place) + '</div>' +
    '<span class="tag"><i class="dot" style="background:' + window.sectorColor(d.sector) + '"></i>' + window.sectorName(d.sector) + '</span> ' +
    '<span class="tag">' + t(d.kind === 'park' ? 'kind_park' : 'kind_plant') + '</span>' +
    '<div style="margin-top:10px">' +
      '<div class="metarow"><span>' + t('pop_op') + '</span><b>' + mw(d.op) + '</b></div>' +
      (d.con ? '<div class="metarow"><span>' + t('pop_con') + '</span><b>' + mw(d.con) + '</b></div>' : '') +
      (d.plan ? '<div class="metarow"><span>' + t('pop_plan') + '</span><b>' + mw(d.plan) + '</b></div>' : '') +
      '<div class="metarow"><span>' + t('pop_owner') + '</span><b>' + esc(d.owner) + ' (' + esc(d.ownerCountry) + ')</b></div>' +
      '<div class="metarow"><span>' + t('pop_units') + '</span><b>' + d.units + (d.firstYear ? ' · ' + t('pop_since') + ' ' + d.firstYear : '') + '</b></div>' +
    '</div>' +
    '<div style="font-size:11px;color:#6b6a78;margin-top:9px">' + t(d.model.length ? 'pop_modeled' : 'pop_unmodeled') + '</div>' +
    '<a class="btn block" style="margin-top:11px" href="facility.html?id=' + q + '">' + t('pop_view') + ' →</a>' +
    '<div class="poplinks"><a href="ownership.html?id=' + q + '">' + t('k_owndetail') + '</a>' +
    '<a href="financing.html?id=' + q + '">' + t('k_findetail') + '</a></div>';
};

window.siteCard = function (pop) {
  var current = null, pinned = false, timer = null;
  function render() {
    pop.innerHTML = window.siteCardHtml(current);
    pop.querySelector('.x').addEventListener('click', function () { hide(true); });
  }
  function show(d, pin) {
    clearTimeout(timer);
    if (pinned && !pin) return;            /* a pinned card isn't replaced by hovering elsewhere */
    current = d; pinned = !!pin;
    render();
    pop.classList.add('on');
  }
  function hide(force) {
    if (pinned && !force) return;
    pinned = false; current = null;
    pop.classList.remove('on');
  }
  function leave() { if (!pinned) { clearTimeout(timer); timer = setTimeout(function () { hide(false); }, 250); } }
  pop.addEventListener('mouseenter', function () { clearTimeout(timer); });
  pop.addEventListener('mouseleave', leave);
  return {
    hover: function (d) { show(d, false); },
    leave: leave,
    pin: function (d) { show(d, true); },
    hide: function () { hide(true); },
    refresh: function () { if (current) render(); },
    /* wire a d3 selection of markers */
    bind: function (sel) {
      sel.attr('tabindex', 0).attr('role', 'button')
        .attr('aria-label', function (d) { return d.name; })
        .on('mouseenter focus', function (e, d) { show(d, false); })
        .on('mouseleave blur', leave)
        .on('click', function (e, d) { e.stopPropagation(); show(d, true); })
        .on('keydown', function (e, d) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(d, true); } });
    }
  };
};

/* Indonesia province basemap, shared by the map views. */
window.BASEMAP_URL = 'https://cdn.jsdelivr.net/npm/datamaps@0.5.10/src/js/data/idn.topo.json';

window.getFac = function (id) {
  return window.FAC.find(function (f) { return f.id === id; }) || window.FAC[0];
};
