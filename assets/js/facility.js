/* Facility detail page.
   Headline feature: a live coal-price / grid-tariff / solar-capex SENSITIVITY model that
   recomputes the levelized cost of each decarbonization pathway and flags the cheapest one.
   The cost model is intentionally simple and parametric — illustrative of how GARUDA's
   capacity-expansion outputs would drive the page, not a substitute for them. */
(function () {
  var params = new URLSearchParams(location.search);
  var fac = window.getFac(params.get('id'));

  var t = window.tr;

  var res = window.placeholderResults(fac);
  var det = (window.SITE_DETAILS || {})[fac.id];
  function mw(v) { return v ? Math.round(v).toLocaleString() + ' MW' : '—'; }
  var esc = window.esc;

  /* Earthwise status -> op / con / plan, or 'off' for cancelled, shelved, retired, closed, unknown */
  var BUCKET = { 'Operating': 'op', 'Construction': 'con', 'Pre-Construction': 'plan', 'Announced': 'plan' };
  function bucket(st) { return BUCKET[st] || 'off'; }
  function statusLabel(st) { return t('st_' + String(st).replace(/[^A-Za-z]/g, '')) || st; }
  function pill(st) { return '<span class="st st-' + bucket(st) + '">' + esc(statusLabel(st)) + '</span>'; }
  var OWNERSHIP = { POE: 'own_poe', SOE: 'own_soe', Mixed: 'own_mixed', Public: 'own_public' };

  /* header + site profile (real data) */
  var showAllUnits = false;
  function renderProfile() {
    document.getElementById('facName').textContent = fac.name;
    document.title = fac.short + ' · CITRA';
    document.getElementById('facMeta').textContent = [fac.prov, fac.regency, window.sectorName(fac.sector),
      t(fac.kind === 'park' ? 'kind_park' : 'kind_plant')].filter(Boolean).join(' · ');
    document.getElementById('facStats').innerHTML = [
      [mw(fac.op), t('pop_op')], [mw(fac.con), t('pop_con')], [mw(fac.plan), t('pop_plan')],
      [esc(fac.owner), t('pop_owner') + ' · ' + esc(fac.ownerCountry)]
    ].map(function (s) { return '<div class="stat"><b>' + s[0] + '</b><small>' + s[1] + '</small></div>'; }).join('');
    document.getElementById('facModel').textContent = fac.model.length
      ? t('fac_modeled') + ' (' + fac.model.length + ' ' + t('fac_nodes') + ': ' + fac.model.join(', ') + ').'
      : t('fac_unmodeled');
    if (!det) return;

    /* key facts */
    var place = [det.village, det.district, fac.regency, fac.prov].filter(Boolean).join(', ');
    document.getElementById('locCaption').textContent = place + ' · ' + fac.lat.toFixed(3) + ', ' + fac.lng.toFixed(3) +
      ' (' + t(fac.loc === 'exact' ? 'k_exact' : 'k_approx') + ')';
    var top = det.owners[0], more = det.owners.length - 1;
    var owners = top
      ? window.ownerLink(top) + ' <span class="mut">· ' + esc(top.country || '—') + ' · ' + Math.round(top.share) + '%</span>' +
        (more > 0 ? ' <span class="mut">+ ' + more + ' ' + t('k_more') + '</span>' : '')
      : '—';
    var facts = [
      ['k_island', esc(det.island || '—') + (det.smallIsland ? ' · ' + t('k_small') : '')],
      ['k_commod', esc(fac.commodities.join(', '))],
      ['k_ownership', det.ownership.map(function (o) { return t(OWNERSHIP[o]) || esc(o); }).join(', ') + (det.jv ? ' · ' + t('k_jv') : '')],
      ['k_owners', owners + '<br><a href="ownership.html?id=' + encodeURIComponent(fac.id) + '">' + t('k_owndetail') + ' →</a>'],
      ['k_fin', (det.finance.length
        ? det.finance.length + ' ' + t('own_loans') + ' · $' +
          Math.round(det.finance.reduce(function (s, f) { return s + (f.usd || 0); }, 0)).toLocaleString() + 'm'
        : t('fin_none_short')) +
        '<br><a href="financing.html?id=' + encodeURIComponent(fac.id) + '">' + t('k_findetail') + ' →</a>'],
      ['k_other', esc(det.otherPower || '—')],
      SUB ? ['k_substation', subText()] : null,
      SUB && (SUB.ruptl.length || SUB.ruptlNoInfo) ? ['k_ruptl', ruptlText()] : null,
      ['k_aka', det.aliases.length ? esc(det.aliases.slice(0, 6).join(' · ')) + (det.aliases.length > 6 ? ' …' : '') : '—']
    ];
    document.getElementById('facFacts').innerHTML = facts.filter(Boolean).map(function (f) {
      return '<dt>' + t(f[0]) + '</dt><dd>' + f[1] + '</dd>';
    }).join('');

    /* units, grouped by plant; live units first */
    var units = det.units.slice().sort(function (a, b) {
      return (bucket(a.status) === 'off') - (bucket(b.status) === 'off');
    });
    var LIMIT = 12, shown = showAllUnits ? units : units.slice(0, LIMIT), lastPlant = null;
    document.getElementById('unitBody').innerHTML = shown.map(function (u) {
      var head = u.plant !== lastPlant ? '<tr class="grp"><td colspan="6">' + esc(u.plant) + '</td></tr>' : '';
      lastPlant = u.plant;
      return head + '<tr' + (bucket(u.status) === 'off' ? ' class="off"' : '') + '>' +
        '<td>' + esc(u.phase || '—') + (u.fuel ? ' <span class="mut">· ' + esc(u.fuel) + '</span>' : '') + '</td>' +
        '<td style="text-align:right;font-weight:600">' + Math.round(u.mw).toLocaleString() + '</td>' +
        '<td>' + pill(u.status) + '</td>' +
        '<td style="text-align:right">' + (u.start || '—') + '</td>' +
        '<td>' + esc(u.owner || '—') + '</td>' +
        '<td>' + esc(u.project || '—') + '</td></tr>';
    }).join('');
    var more = document.getElementById('unitMore');
    more.style.display = units.length > LIMIT ? '' : 'none';
    more.textContent = showAllUnits ? t('show_less') : t('show_all') + ' (' + units.length + ')';

    /* linked industrial projects */
    document.getElementById('projCard').style.display = det.projects.length ? '' : 'none';
    document.getElementById('projBody').innerHTML = det.projects.map(function (p) {
      return '<tr><td>' + esc(p.name) + (p.phase ? ' <span class="mut">· ' + esc(p.phase) + '</span>' : '') + '</td>' +
        '<td>' + esc(p.product || '—') + '</td><td style="text-align:right">' + esc(p.capacity || '—') + '</td>' +
        '<td>' + esc(p.status || '—') + '</td><td style="text-align:right">' + esc(p.start || '—') + '</td></tr>';
    }).join('');

    /* sources */
    document.getElementById('facSources').innerHTML = t('fac_srcs') + ' ' + fac.ew.length + ' Earthwise ' + t('records') +
      (det.sources.length ? ' · GEM Wiki: ' + det.sources.map(function (u, i) {
        return '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + (i + 1) + '</a>';
      }).join(', ') : '') +
      (SUB ? ' · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' : '');
  }
  /* nearest PLN substation and PLN's own plan for the site (scripts/build_substations.py) */
  var SUB = window.SUBSTATIONS && window.SUBSTATIONS.sites[fac.id];
  function subText() {
    var where = SUB.km < 1 ? t('sub_onsite')
      : t(SUB.sea ? 'sub_sea' : 'sub_km').replace('{km}', SUB.km < 10 ? SUB.km.toFixed(1) : Math.round(SUB.km));
    var rate = window.SUBSTATIONS.costPerKm;
    return esc(SUB.name || '—') + ' <span class="mut">· ' + SUB.kv + ' kV</span><br>' + where +
      (SUB.costM != null && SUB.km >= 1 ? '<br><span class="mut">' + t('sub_cost')
        .replace('{c}', SUB.costM < 10 ? SUB.costM.toFixed(1) : Math.round(SUB.costM)).replace('{r}', rate) + '</span>' : '');
  }
  function ruptlText() {
    if (!SUB.ruptl.length) return '<span class="mut">' + t('ruptl_noinfo') + '</span>';
    /* a named substation reads in any language; otherwise the plan's short English summary */
    return SUB.ruptl.map(function (r) {
      if (!r.substation) return esc(r.plan || '—');
      return esc(r.substation) + ' <span class="mut">' + [r.voltage_kv && !/kV/.test(r.substation) ? r.voltage_kv + ' kV' : '',
        r.line_km ? t('ruptl_km').replace('{km}', r.line_km) : '', r.cod_year ? 'COD ' + r.cod_year : ''].filter(Boolean).join(' · ') + '</span>';
    }).join('<br>');
  }

  /* locator map: the site and its neighbours, with an inset of Indonesia for context */
  function drawLocator() {
    var W = 360, H = 210, el = document.getElementById('locMap');
    var svg = d3.select(el).append('svg').attr('viewBox', '0 0 ' + W + ' ' + H).attr('width', '100%').style('display', 'block');
    d3.json(window.BASEMAP_URL).then(function (topo) {
      var land = topojson.feature(topo, topo.objects.idn);
      var dLat = 2.0, dLng = dLat * W / H;
      var view = { type: 'MultiPoint', coordinates: [[fac.lng - dLng, fac.lat - dLat], [fac.lng + dLng, fac.lat + dLat]] };
      var proj = d3.geoMercator().fitSize([W, H], view), path = d3.geoPath(proj);
      svg.append('g').selectAll('path').data(land.features).join('path')
        .attr('d', path).attr('fill', '#dfe7ea').attr('stroke', '#fff').attr('stroke-width', 0.8);

      var near = window.FAC.filter(function (f) {
        return f.id !== fac.id && Math.abs(f.lat - fac.lat) < dLat && Math.abs(f.lng - fac.lng) < dLng;
      });
      svg.append('g').selectAll('a').data(near).join('a')
        .attr('href', function (f) { return 'facility.html?id=' + encodeURIComponent(f.id); })
        .append('circle')
        .attr('cx', function (f) { return proj([f.lng, f.lat])[0]; })
        .attr('cy', function (f) { return proj([f.lng, f.lat])[1]; })
        .attr('r', 3.5).attr('fill', '#8a9197').attr('stroke', '#fff').attr('stroke-width', 1)
        .append('title').text(function (f) { return f.name; });

      var p = proj([fac.lng, fac.lat]), col = window.sectorColor(fac.sector);
      /* nearest PLN substation, when it falls inside the view */
      if (SUB && SUB.km >= 1 && Math.abs(SUB.lat - fac.lat) < dLat && Math.abs(SUB.lng - fac.lng) < dLng) {
        var q = proj([SUB.lng, SUB.lat]);
        svg.append('line').attr('x1', p[0]).attr('y1', p[1]).attr('x2', q[0]).attr('y2', q[1])
          .attr('stroke', '#2a78d6').attr('stroke-width', 1.5).attr('stroke-dasharray', '4 3');
        svg.append('rect').attr('x', q[0] - 4.5).attr('y', q[1] - 4.5).attr('width', 9).attr('height', 9)
          .attr('fill', '#2a78d6').attr('stroke', '#fff').attr('stroke-width', 1.5)
          .append('title').text((SUB.name || '') + ' · ' + SUB.kv + ' kV');
      }
      if (fac.loc !== 'exact') {
        svg.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', 20)
          .attr('fill', 'none').attr('stroke', col).attr('stroke-dasharray', '3 3').attr('opacity', 0.7);
      }
      svg.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', 13).attr('fill', col).attr('opacity', 0.18);
      svg.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', 6.5)
        .attr('fill', col).attr('stroke', '#fff').attr('stroke-width', 2)
        .append('title').text(fac.name);

      /* inset: all of Indonesia, with the zoomed area outlined */
      var iw = 96, ih = 40, ix = W - iw - 6, iy = H - ih - 6;
      var inset = svg.append('g').attr('transform', 'translate(' + ix + ',' + iy + ')');
      inset.append('rect').attr('width', iw).attr('height', ih).attr('rx', 3)
        .attr('fill', '#fff').attr('stroke', 'var(--line)').attr('opacity', 0.95);
      var iproj = d3.geoMercator().fitExtent([[3, 3], [iw - 3, ih - 3]], land);
      inset.append('path').attr('d', d3.geoPath(iproj)(land)).attr('fill', '#c3ccd1');
      var a = iproj([fac.lng - dLng, fac.lat + dLat]), b = iproj([fac.lng + dLng, fac.lat - dLat]);
      inset.append('rect').attr('x', a[0]).attr('y', a[1])
        .attr('width', Math.max(3, b[0] - a[0])).attr('height', Math.max(3, b[1] - a[1]))
        .attr('fill', 'none').attr('stroke', col).attr('stroke-width', 1.2);
    }).catch(function () {
      el.innerHTML = '<div class="sub" style="padding:40px 10px;text-align:center">Map unavailable offline.</div>';
    });
  }
  drawLocator();

  document.getElementById('unitMore').addEventListener('click', function () {
    showAllUnits = !showAllUnits; renderProfile();
  });

  /* capacity by start year, stacked by status (live units only) */
  var tlChart;
  function buildTimeline() {
    if (!det) return;
    var live = det.units.filter(function (u) { return bucket(u.status) !== 'off'; });
    var years = live.map(function (u) { return u.start; }).filter(Boolean);
    if (!years.length) return;
    var lo = Math.min.apply(null, years), hi = Math.max.apply(null, years), labels = [];
    for (var y = lo; y <= hi; y++) labels.push(String(y));
    var unknown = live.some(function (u) { return !u.start; });
    if (unknown) labels.push('?');
    function series(b) {
      var out = labels.map(function () { return 0; });
      live.forEach(function (u) {
        if (bucket(u.status) !== b) return;
        out[u.start ? u.start - lo : labels.length - 1] += u.mw;
      });
      return out;
    }
    var spec = [['op', 'pop_op', '#2a78d6'], ['con', 'pop_con', '#86b6ef'], ['plan', 'pop_plan', '#c3ccd1']];
    tlChart = new Chart(document.getElementById('tlChart'), {
      type: 'bar',
      data: { labels: labels, datasets: spec.map(function (s) {
        return { label: t(s[1]), key: s[1], data: series(s[0]), backgroundColor: s[2], borderRadius: 3, borderColor: '#fff', borderWidth: 1 };
      }).filter(function (d) { return d.data.some(Boolean); }) },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } },
          tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + Math.round(c.raw).toLocaleString() + ' MW'; } } } },
        scales: { x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { stacked: true, ticks: { font: { size: 11 }, callback: function (v) { return v.toLocaleString(); } },
            title: { display: true, text: 'MW' } } } }
    });
  }

  /* Pathway colours: neutral grey for the coal baseline, then aqua / blue / orange from the
     validated chart palette (on-site renewables, grid, hybrid). */
  var PATH_COLOR = { bau: '#5b6670', solar: '#1baf7a', grid: '#2a78d6', hybrid: '#eb6834' };

  var COST_KEYS = ['cost_pv', 'cost_batt', 'cost_conn', 'cost_bulk', 'cost_om'];
  var mixChart, costChart;

  /* GARUDA 2035 results (window.GARUDA, scripts/build_results.py). For a site that is a model
     node, each pathway starts from its no-CO2-cap run (BAU = base, on-site = captive, grid = grid,
     hybrid = gridcaptive) and the sliders move that cost to first order: coal burned x coal price,
     grid imports x tariff, solar + battery investment x capex multiplier, with the build held fixed.
     Other sites keep the illustrative parametric model below. */
  var G = window.GARUDA, site = G && G.sites[fac.id];
  var RUN = { bau: 'base', solar: 'captive', grid: 'grid', hybrid: 'gridcaptive' };
  var wired = !!(site && site.path && Object.keys(RUN).every(function (k) { return site.path[RUN[k]]; }));
  var prices = wired ? G.islands[site.island].prices : null;
  /* GARUDA prices captive coal per MMBtu; the slider is per tonne at 4,200 kcal/kg (GAR). */
  var MMBTU_PER_T = 16.67;
  function setRange(id, min, max, step, v) {
    var el = document.getElementById(id);
    el.min = min; el.max = max; el.step = step; el.value = v;
  }
  if (wired) {
    setRange('slCoal', 30, 130, 1, Math.round(prices.coal * MMBTU_PER_T));
    setRange('slTariff', 40, 120, 1, prices.tariff);
    setRange('slSolar', 0.4, 1.6, 0.05, 1);
  }

  /* ---- sensitivity state ---- */
  var state = { cp: Number(document.getElementById('slCoal').value), gt: Number(document.getElementById('slTariff').value),
    sx: Number(document.getElementById('slSolar').value) };

  /* A pathway at coal price cp ($/t): linear between GARUDA runs at different coal prices (the
     anchors), and from the nearest anchor to first order outside them. Returns the run figures and
     the coal price ($/t) they were solved at. */
  var FIELDS = ['cost', 'mwh', 'co2', 'coal', 'imp', 're', 'served'];
  function atCoal(p, cp) {
    var a = p.anchors;
    if (!a || a.length < 2) return { r: p, t: prices.coal * MMBTU_PER_T };
    if (cp <= a[0].t) return { r: a[0], t: a[0].t };
    if (cp >= a[a.length - 1].t) return { r: a[a.length - 1], t: a[a.length - 1].t };
    for (var i = 0; cp > a[i + 1].t; i++) {}
    var f = (cp - a[i].t) / (a[i + 1].t - a[i].t), r = { mix: {} };
    FIELDS.forEach(function (k) { r[k] = a[i][k] + f * (a[i + 1][k] - a[i][k]); });
    var m0 = a[i].mix || {}, m1 = a[i + 1].mix || {};
    Object.keys(m0).concat(Object.keys(m1)).forEach(function (k) {
      r.mix[k] = (m0[k] || 0) + f * ((m1[k] || 0) - (m0[k] || 0));
    });
    return { r: r, t: cp };
  }

  function garudaPaths(state) {
    var base = atCoal(site.path.base, state.cp).r, baseInt = base.co2 / base.mwh;
    return ['bau', 'solar', 'grid', 'hybrid'].map(function (k) {
      var at = atCoal(site.path[RUN[k]], state.cp), p = at.r;
      /* cost parts, US$/yr: coal burned, grid purchases, new solar + storage investment, and the
         rest (O&M, existing plant, start-ups), which the sliders leave unchanged */
      var parts = { fuel: p.coal * state.cp / MMBTU_PER_T, grid: p.imp * state.gt, re: p.re * state.sx,
        other: p.cost - p.coal * at.t / MMBTU_PER_T - p.imp * prices.tariff - p.re };
      var cost = parts.fuel + parts.grid + parts.re + parts.other;
      return { key: k, name: t('path_' + k), short: t(k === 'bau' || k === 'grid' ? 'path_' + k + '_s' : 'path_' + k),
        val: cost / p.mwh, em: Math.round((1 - p.co2 / p.mwh / baseInt) * 100), color: PATH_COLOR[k],
        parts: parts, mwh: p.mwh, mix: p.mix || {} };
    });
  }

  /* Pathway levelized cost of electricity ($/MWh) given coal price (cp, $/t),
     grid tariff (gt, $/MWh) and solar+storage capex multiplier (sx). */
  function lcoe(state) {
    if (wired) return garudaPaths(state);
    var bau   = 30 + 0.55 * state.cp;          /* coal fuel scales with price */
    var solar = (78 * state.sx) + 6;           /* capex-driven, coal-price insensitive */
    var grid  = 18 + 0.85 * state.gt;          /* tariff + transmission charge */
    var hybrid = 0.45 * solar + 0.40 * grid + 0.15 * bau;
    return [
      { key:'bau',    name: t('path_bau'),    short: t('path_bau_s'),  val: bau,    em: 0,  color: PATH_COLOR.bau },
      { key:'solar',  name: t('path_solar'),  short: t('path_solar'),  val: solar,  em: 45, color: PATH_COLOR.solar },
      { key:'grid',   name: t('path_grid'),   short: t('path_grid_s'), val: grid,   em: 55, color: PATH_COLOR.grid },
      { key:'hybrid', name: t('path_hybrid'), short: t('path_hybrid'), val: hybrid, em: 68, color: PATH_COLOR.hybrid }
    ];
  }

  function emText(em) { return (em > 0 ? '−' + em : em < 0 ? '+' + (-em) : '±0') + '% CO₂'; }
  function money(v) { return '$' + v.toFixed(wired ? 1 : 0); }

  /* first coal price above the current one at which some pathway undercuts BAU (wired sites) */
  function coalCrossover() {
    for (var x = state.cp + 1; x <= 300; x++) {
      var rows = lcoe({ cp: x, gt: state.gt, sx: state.sx });
      var alt = rows.slice(1).reduce(function (a, b) { return b.val < a.val ? b : a; });
      if (alt.val < rows[0].val) return { x: x, path: alt };
    }
    return null;
  }

  /* share of park electricity from one source; 're' is solar, wind and geothermal together */
  var RE = ['solar', 'wind', 'geo'];
  function share(mix, key) {
    return key === 're' ? RE.reduce(function (sum, k) { return sum + (mix[k] || 0); }, 0) : mix[key] || 0;
  }

  var chart;
  function recompute() {
    var rows = lcoe(state);
    var cheapest = rows.reduce(function (a, b) { return b.val < a.val ? b : a; });
    var max = Math.max.apply(null, rows.map(function (r) { return r.val; }));

    /* pathway bars */
    document.getElementById('pathlist').innerHTML = rows.map(function (r) {
      var win = r.key === cheapest.key ? ' win' : '';
      return '<div class="pth' + win + '">' +
        '<div class="top"><b>' + r.name + (win ? ' <span class="rec">· ' + t(wired ? 'path_cheapest' : 'recommended') + '</span>' : '') + '</b>' +
        '<span style="color:#6b6a78">' + money(r.val) + '/MWh · ' + emText(r.em) + '</span></div>' +
        '<div class="track"><div class="bar" style="width:' + Math.round(r.val / max * 100) + '%;background:' + r.color + '"></div></div>' +
      '</div>';
    }).join('');

    if (wired) {
      var cx = cheapest.key === 'bau' ? coalCrossover() : null;
      document.getElementById('insight').innerHTML = cheapest.key !== 'bau'
        ? t('ins_res_now').replace('{p}', state.cp).replace('{path}', cheapest.name)
        : cx ? t('ins_res_later').replace('{p}', state.cp).replace('{x}', cx.x).replace('{path}', cx.path.name)
          : t('ins_res_never');
    } else {
    /* insight: coal-price crossover vs the cheapest clean option */
    var cleanMin = Math.min(rows[1].val, rows[2].val, rows[3].val);
    var crossover = Math.round((cleanMin - 30) / 0.55);
    var ins = document.getElementById('insight');
    if (state.cp >= crossover) {
      ins.innerHTML = t('ins_now').replace('{p}', state.cp);
    } else {
      ins.innerHTML = t('ins_later').replace('{x}', crossover).replace('{p}', state.cp);
    }
    }

    /* chart */
    if (chart) {
      chart.data.datasets[0].data = rows.map(function (r) { return Number(r.val.toFixed(wired ? 1 : 0)); });
      chart.data.datasets[0].backgroundColor = rows.map(function (r) { return r.key === cheapest.key ? r.color : r.color + '59'; });
      chart.update();
    }
    if (wired && mixChart) {
      mixChart.data.datasets.forEach(function (d) { d.data = rows.map(function (r) { return Math.round(share(r.mix, d.key) * 100); }); });
      mixChart.update();
    }
    if (wired && costChart) {
      costChart.data.datasets.forEach(function (d) { d.data = rows.map(function (r) { return Number((r.parts[d.key] / r.mwh).toFixed(1)); }); });
      costChart.update();
    }
  }

  /* ---- sliders ---- */
  function bind(id, key, fmt) {
    var el = document.getElementById(id), out = document.getElementById(id + 'Out');
    function sync() { state[key] = Number(el.value); out.textContent = fmt(el.value); recompute(); }
    el.addEventListener('input', sync);
    out.textContent = fmt(el.value);
  }
  bind('slCoal', 'cp', function (v) { return '$' + v + '/t'; });
  bind('slTariff', 'gt', function (v) { return '$' + v + '/MWh'; });
  bind('slSolar', 'sx', function (v) { return Math.round(v * 100) + '%'; });

  /* notes that change with whether this site's pathways come from GARUDA */
  function sourceNotes() {
    /* the illustrative-figures warning shows only where the pathways are not from GARUDA */
    var illus = document.getElementById('facIllus');
    illus.style.display = wired ? 'none' : '';
    illus.textContent = t('fac_illus');
    document.getElementById('facPathp').textContent = t(wired ? 'fac_pathp_res' : 'fac_pathp');
    document.getElementById('facMix').textContent = t(wired ? 'fac_mix_res' : 'fac_mix');
    document.getElementById('facCost').textContent = t(wired ? 'fac_cost_res' : 'fac_cost');
    document.getElementById('facPayer').textContent = t(wired ? 'fac_payer_res' : 'fac_payer');
    document.getElementById('mixNote').textContent = wired ? t('mix_note_res')
      : t('mix_note').replace('{c}', res.coal).replace('{e}', res.ei);
  }

  window.onLangChange = function () { /* re-render labels on language switch */
    renderProfile();
    sourceNotes();
    recompute();
    if (tlChart) {
      tlChart.data.datasets.forEach(function (d) { d.label = t(d.key); });
      tlChart.update();
    }
    var shorts = lcoe(state).map(function (r) { return r.short; });
    if (mixChart && wired) {
      mixChart.data.labels = shorts;
      mixChart.data.datasets.forEach(function (d) { d.label = t('src_' + d.key); });
      mixChart.update();
    } else if (mixChart) { mixChart.data.labels = [t('mix_coal'), t('mix_other'), t('mix_clean')]; mixChart.update(); }
    if (costChart && wired) {
      costChart.data.labels = shorts;
      costChart.data.datasets.forEach(function (d) { d.label = t('part_' + d.key); });
      costChart.update();
    } else if (costChart) { costChart.data.labels = COST_KEYS.map(t); costChart.update(); }
    if (chart) { chart.data.labels = shorts; chart.update(); }
  };

  /* ---- charts (init after libs ready) ---- */
  window.addEventListener('load', function () {
    buildTimeline();
    var rows = lcoe(state), shorts = rows.map(function (r) { return r.short; });
    var legend = { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, padding: 8 } };
    if (wired) {
      /* 2035 electricity supply by pathway (shares of park electricity demand) */
      document.getElementById('mixBox').style.height = '220px';
      var SRC = [['coal', PATH_COLOR.bau], ['grid', PATH_COLOR.grid], ['re', PATH_COLOR.solar]];
      mixChart = new Chart(document.getElementById('mixChart'), {
        type: 'bar',
        data: { labels: shorts, datasets: SRC.map(function (s) {
          return { key: s[0], label: t('src_' + s[0]), backgroundColor: s[1], borderColor: '#fff', borderWidth: 1,
            data: rows.map(function (r) { return Math.round(share(r.mix, s[0]) * 100); }) };
        }) },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: legend, tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + c.raw + '%'; } } } },
          scales: { x: { stacked: true, max: 100, ticks: { font: { size: 10 }, callback: function (v) { return v + '%'; } } },
            y: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } } } }
      });
    } else {
    /* energy mix */
    var other = Math.max(0, 100 - res.coal - res.clean);
    mixChart = new Chart(document.getElementById('mixChart'), {
      type: 'doughnut',
      data: { labels: [t('mix_coal'), t('mix_other'), t('mix_clean')],
        datasets: [{ data: [res.coal, other, res.clean], backgroundColor: [PATH_COLOR.bau, '#b7c1c5', PATH_COLOR.solar], borderWidth: 2, borderColor: '#fff' }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '60%',
        plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 }, padding: 8 } } } }
    });
    }

    /* sensitivity chart. For GARUDA sites the axis is fixed over the sliders' whole range, so the
       bars move against a steady scale while dragging. */
    var yRange = {};
    if (wired) {
      var lo = Infinity, hi = 0;
      [['slCoal', 'cp'], ['slTariff', 'gt'], ['slSolar', 'sx']].reduce(function (sts, s) {
        var el = document.getElementById(s[0]), out = [];
        sts.forEach(function (st) { [el.min, el.max].forEach(function (v) { var n = Object.assign({}, st); n[s[1]] = Number(v); out.push(n); }); });
        return out;
      }, [{}]).forEach(function (st) {
        lcoe(st).forEach(function (r) { lo = Math.min(lo, r.val); hi = Math.max(hi, r.val); });
      });
      yRange = { min: Math.max(0, Math.floor(lo * 0.8 / 10) * 10), max: Math.ceil(hi / 10) * 10 };
    }
    chart = new Chart(document.getElementById('sensChart'), {
      type: 'bar',
      data: { labels: rows.map(function (r) { return r.short; }),
        datasets: [{ label: 'LCOE ($/MWh)', data: rows.map(function (r) { return Number(r.val.toFixed(wired ? 1 : 0)); }), borderRadius: 3,
          backgroundColor: rows.map(function (r) { return r.color; }) }] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: Object.assign({ title: { display: true, text: '$/MWh' }, ticks: { font: { size: 11 } } }, yRange), x: { ticks: { font: { size: 11 } } } } }
    });

    /* hybrid cost breakdown, scaled by facility transition cost.
       Grid connection (facility interconnection) is kept separate from bulk/shared
       transmission upgrades, since they map to different payers. */
    if (wired) {
      /* cost per MWh by pathway, split into what the sliders move */
      var PARTS = [['fuel', PATH_COLOR.bau], ['other', '#b7c1c5'], ['grid', PATH_COLOR.grid], ['re', '#f2b31d']];
      costChart = new Chart(document.getElementById('costChart'), {
        type: 'bar',
        data: { labels: shorts, datasets: PARTS.map(function (s) {
          return { key: s[0], label: t('part_' + s[0]), backgroundColor: s[1], borderColor: '#fff', borderWidth: 1,
            data: rows.map(function (r) { return Number((r.parts[s[0]] / r.mwh).toFixed(1)); }) };
        }) },
        options: { responsive: true, maintainAspectRatio: false,
          plugins: { legend: legend, tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': $' + c.raw + '/MWh'; } } } },
          scales: { x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } },
            y: { stacked: true, title: { display: true, text: '$/MWh' }, ticks: { font: { size: 11 } } } } }
      });
      recompute();
      return;
    }
    var c = res.cost;
    costChart = new Chart(document.getElementById('costChart'), {
      type: 'bar',
      data: { labels: COST_KEYS.map(t),
        datasets: [{ data: [c*0.30, c*0.20, c*0.16, c*0.22, c*0.12].map(function (x) { return Number(x.toFixed(1)); }),
          backgroundColor: [PATH_COLOR.solar, '#5dcaa5', PATH_COLOR.grid, '#184f95', '#9aa3a9'], borderRadius: 3 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { y: { ticks: { font: { size: 11 }, callback: function (v) { return '$' + v + 'B'; } } }, x: { ticks: { font: { size: 10 } } } } }
    });

    recompute();
  });

  renderProfile();
  sourceNotes();
  recompute();
})();
