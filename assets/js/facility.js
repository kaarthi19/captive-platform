/* Facility detail page.
   Headline feature: a live coal-price / grid-tariff / solar-capex SENSITIVITY model that
   recomputes the levelized cost of each decarbonization pathway and flags the cheapest one.
   The cost model is intentionally simple and parametric — illustrative of how the Julia/JuMP
   capacity-expansion outputs would drive the page, not a substitute for them. */
(function () {
  var params = new URLSearchParams(location.search);
  var fac = window.getFac(params.get('id'));

  function t(k) { return (window.I18N[window.CP_LANG || 'en'] || window.I18N.en)[k]; }

  /* header */
  document.getElementById('facName').textContent = fac.name;
  document.getElementById('facMeta').textContent = fac.prov + ' · ' + window.IND_NAME[fac.ind] + ' park';

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

  window.onLangChange = recompute; /* re-render labels on language switch */

  /* ---- charts (init after libs ready) ---- */
  window.addEventListener('load', function () {
    /* energy mix */
    var other = Math.max(0, 100 - fac.coal - fac.clean);
    new Chart(document.getElementById('mixChart'), {
      type: 'doughnut',
      data: { labels: ['Coal', 'Other fossil', 'Clean'],
        datasets: [{ data: [fac.coal, other, fac.clean], backgroundColor: ['#272636', '#888780', '#1d9e75'], borderWidth: 2, borderColor: '#fff' }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '60%',
        plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 }, padding: 8 } } } }
    });
    document.getElementById('mixNote').textContent = fac.coal + '% coal today · ' + fac.ei + ' tCO₂/MWh';

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
    var c = fac.cost;
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
  var c = fac.cost;
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

  recompute();
})();
