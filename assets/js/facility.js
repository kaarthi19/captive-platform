/* Facility detail page.
   Headline feature: a live coal-price / grid-tariff / solar-capex SENSITIVITY model that
   recomputes the levelized cost of each decarbonization pathway and flags the cheapest one.
   The cost model is intentionally simple and parametric — illustrative of how GARUDA's
   capacity-expansion outputs would drive the page, not a substitute for them. */
(function () {
  var params = new URLSearchParams(location.search);
  var fac = window.getFac(params.get('id'));

  function t(k) { return (window.I18N[window.CP_LANG || 'en'] || window.I18N.en)[k]; }

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
    document.title = fac.short + ' · Captive Power Platform';
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
      ['k_aka', det.aliases.length ? esc(det.aliases.slice(0, 6).join(' · ')) + (det.aliases.length > 6 ? ' …' : '') : '—']
    ];
    document.getElementById('facFacts').innerHTML = facts.map(function (f) {
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
      }).join(', ') : '');
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

  /* ---- sensitivity state ---- */
  var state = { cp: 90, gt: 70, sx: 1.0 };

  /* Pathway levelized cost of electricity ($/MWh) given coal price (cp, $/t),
     grid tariff (gt, $/MWh) and solar+storage capex multiplier (sx). */
  function lcoe(state) {
    var bau   = 30 + 0.55 * state.cp;          /* coal fuel scales with price */
    var solar = (78 * state.sx) + 6;           /* capex-driven, coal-price insensitive */
    var grid  = 18 + 0.85 * state.gt;          /* tariff + transmission charge */
    var hybrid = 0.45 * solar + 0.40 * grid + 0.15 * bau;
    return [
      { key:'bau',    name:'Business as usual', val: bau,    em: 0,  color:'#272636' },
      { key:'solar',  name:'On-site solar + storage', val: solar, em: 45, color:'#1d9e75' },
      { key:'grid',   name:'Grid connection (PLN)',   val: grid,  em: 55, color:'#378add' },
      { key:'hybrid', name:'Hybrid', val: hybrid, em: 68, color:'#fc4d50' }
    ];
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
        '<div class="top"><b>' + r.name + '</b>' +
        '<span style="color:#6b6a78">$' + r.val.toFixed(0) + '/MWh · −' + r.em + '% CO₂</span></div>' +
        '<div class="track"><div class="bar" style="width:' + Math.round(r.val / max * 100) + '%;background:' + r.color + '"></div></div>' +
      '</div>';
    }).join('');

    /* insight: coal-price crossover vs the cheapest clean option */
    var cleanMin = Math.min(rows[1].val, rows[2].val, rows[3].val);
    var crossover = Math.round((cleanMin - 30) / 0.55);
    var ins = document.getElementById('insight');
    if (state.cp >= crossover) {
      ins.innerHTML = 'At <b>$' + state.cp + '/t</b>, coal is already more expensive than the cheapest clean pathway — a transition lowers cost today.';
    } else {
      ins.innerHTML = 'Clean pathways undercut coal once the coal price rises above <b>$' + crossover + '/t</b> (currently $' + state.cp + '/t).';
    }

    /* chart */
    if (chart) {
      chart.data.datasets[0].data = rows.map(function (r) { return Number(r.val.toFixed(0)); });
      chart.data.datasets[0].backgroundColor = rows.map(function (r) { return r.key === cheapest.key ? '#fc4d50' : '#c9c8d0'; });
      chart.update();
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

  window.onLangChange = function () { /* re-render labels on language switch */
    renderProfile();
    recompute();
    if (tlChart) {
      tlChart.data.datasets.forEach(function (d) { d.label = t(d.key); });
      tlChart.update();
    }
  };

  /* ---- charts (init after libs ready) ---- */
  window.addEventListener('load', function () {
    buildTimeline();
    /* energy mix */
    var other = Math.max(0, 100 - res.coal - res.clean);
    new Chart(document.getElementById('mixChart'), {
      type: 'doughnut',
      data: { labels: ['Coal', 'Other fossil', 'Clean'],
        datasets: [{ data: [res.coal, other, res.clean], backgroundColor: ['#272636', '#888780', '#1d9e75'], borderWidth: 2, borderColor: '#fff' }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '60%',
        plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 }, padding: 8 } } } }
    });
    document.getElementById('mixNote').textContent = res.coal + '% coal today · ' + res.ei + ' tCO₂/MWh';

    /* sensitivity chart */
    var rows = lcoe(state);
    chart = new Chart(document.getElementById('sensChart'), {
      type: 'bar',
      data: { labels: rows.map(function (r) { return r.name.replace(' (PLN)', '').replace('Business as usual', 'BAU (coal)'); }),
        datasets: [{ label: 'LCOE ($/MWh)', data: rows.map(function (r) { return Number(r.val.toFixed(0)); }), backgroundColor: '#c9c8d0' }] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { title: { display: true, text: '$/MWh' }, ticks: { font: { size: 11 } } }, x: { ticks: { font: { size: 11 } } } } }
    });

    /* hybrid cost breakdown, scaled by facility transition cost.
       Grid connection (facility interconnection) is kept separate from bulk/shared
       transmission upgrades, since they map to different payers. */
    var c = res.cost;
    new Chart(document.getElementById('costChart'), {
      type: 'bar',
      data: { labels: ['Solar PV', 'Battery storage', 'Grid connection', 'Bulk transmission', 'O&M'],
        datasets: [{ data: [c*0.30, c*0.20, c*0.16, c*0.22, c*0.12].map(function (x) { return Number(x.toFixed(1)); }),
          backgroundColor: ['#1d9e75', '#5dcaa5', '#378add', '#185fa5', '#b4b2a9'] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { y: { ticks: { font: { size: 11 }, callback: function (v) { return '$' + v + 'B'; } } }, x: { ticks: { font: { size: 10 } } } } }
    });

    recompute();
  });

  /* investment table, scaled by facility transition cost */
  var c = res.cost;
  var inv = [
    ['Park owner', 'On-site solar + storage', c * 0.40],
    ['PLN (local)', 'Facility grid interconnection', c * 0.16],
    ['PLN / system · JETP', 'Bulk transmission upgrades', c * 0.22],
    ['Financiers / DFIs', 'Green bonds, blended debt', c * 0.14],
    ['Provincial gov', 'Permitting, RUED alignment', c * 0.08]
  ];
  document.getElementById('invBody').innerHTML = inv.map(function (r) {
    return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td style="text-align:right;font-weight:600">$' + r[2].toFixed(1) + 'B</td></tr>';
  }).join('');

  renderProfile();
  recompute();
})();
