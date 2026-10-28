/* Region page. Takes ?r=<region key> (default Sulawesi).
   Headline feature: a TRANSMISSION MAP of the region's captive coal sites; where corridors exist
   (illustrative for Sulawesi until GARUDA's transmission results load) it also draws PLN grid hubs
   and the corridors that would connect them, with a toggle for proposed vs existing lines.
   Plus a per-site operating-capacity chart (colored by sector) and the upgrades table. */
(function () {
  var W = 560, H = 460, MAX_BARS = 15;
  var key = new URLSearchParams(location.search).get('r');
  var region = window.REGIONS.find(function (r) { return r.key === key; }) || window.REGIONS[0];
  var sites = window.FAC.filter(function (f) { return f.region === region.key; });
  var facById = {}; window.FAC.forEach(function (f) { facById[f.id] = f; });
  var hubById = {}; window.HUBS.forEach(function (h) { hubById[h.id] = h; });
  var corridors = window.CORRIDORS.filter(function (c) { return facById[c.from] && facById[c.from].region === region.key; });
  var hubs = window.HUBS.filter(function (h) { return corridors.some(function (c) { return c.hub === h.id; }); });
  var proposed = corridors.filter(function (c) { return c.status === 'proposed'; });
  var showProposed = true;

  var t = window.tr;
  var esc = window.esc;

  /* region picker: every region with sites, largest operating capacity first */
  var regions = window.REGIONS.map(function (r) {
    var s = window.FAC.filter(function (f) { return f.region === r.key; });
    return { r: r, n: s.length, op: d3.sum(s, function (f) { return f.op; }) };
  }).filter(function (x) { return x.n; }).sort(function (a, b) { return b.op - a.op; });

  function render() {
    var name = window.regionName(region);
    document.getElementById('regName').textContent = name;
    document.title = name + ' · ' + t('nav_region') + ' · Captive Power Platform';
    document.getElementById('regPick').innerHTML = '<span class="fl">' + t('f_region') + '</span>' + regions.map(function (x) {
      var on = x.r.key === region.key;
      return '<a class="chip' + (on ? ' on' : '') + '" role="tab" aria-selected="' + on + '" href="region.html?r=' +
        encodeURIComponent(x.r.key) + '">' + esc(window.regionName(x.r)) + ' <span class="mut">' + x.n + '</span></a>';
    }).join('');

    document.getElementById('rsGW').textContent = (d3.sum(sites, function (f) { return f.op; }) / 1000).toFixed(1) + ' GW';
    document.getElementById('rsSites').textContent = sites.length;
    document.getElementById('rsConn').textContent = proposed.length ? (d3.sum(proposed, function (c) { return c.mw; }) / 1000).toFixed(1) + ' GW' : '—';
    document.getElementById('rsCapex').textContent = proposed.length ? '$' + d3.sum(proposed, function (c) { return c.cost; }).toFixed(1) + 'B' : '—';

    document.getElementById('txBody').innerHTML = proposed.map(function (c) {
      return '<tr><td>' + esc(facById[c.from].short) + ' ↔ ' + esc(hubById[c.hub].name) + ' ' + c.kv + ' kV</td>' +
        '<td style="text-align:right">' + c.mw.toLocaleString() + '</td>' +
        '<td style="text-align:right">$' + c.cost.toFixed(1) + 'B</td></tr>';
    }).join('');
    var hasTx = corridors.length > 0;
    document.getElementById('txTable').style.display = hasTx ? '' : 'none';
    document.getElementById('txTableNone').style.display = hasTx ? 'none' : '';
    document.getElementById('txNone').style.display = hasTx ? 'none' : '';
    document.getElementById('txToggle').style.display = hasTx ? '' : 'none';
    document.querySelectorAll('.txleg').forEach(function (el) { el.style.display = hasTx ? '' : 'none'; });
    document.querySelector('#txToggle span').textContent = t(showProposed ? 'reg_toggle_on' : 'reg_toggle');

    var shown = Math.min(MAX_BARS, sites.filter(function (f) { return f.op > 0; }).length);
    var total = sites.filter(function (f) { return f.op > 0; }).length;
    document.getElementById('regChartNote').textContent = total > shown
      ? t('reg_top').replace('{n}', shown).replace('{m}', total) : '';
  }

  var svg = d3.select('#txmap').append('svg')
    .attr('viewBox', '0 0 ' + W + ' ' + H).attr('width', '100%').style('display', 'block');

  d3.json(window.BASEMAP_URL).then(function (topo) {
    var all = topojson.feature(topo, topo.objects.idn);
    var land = { type: 'FeatureCollection', features: all.features.filter(function (f) {
      return region.provinces.indexOf(f.properties && f.properties.name) >= 0;
    }) };
    /* fit to the provinces and the sites (some sites sit on small islands at the edge) */
    var fit = { type: 'FeatureCollection', features: land.features.concat(sites.map(function (f) {
      return { type: 'Feature', geometry: { type: 'Point', coordinates: [f.lng, f.lat] } };
    })) };
    var proj = d3.geoMercator().fitExtent([[24, 24], [W - 24, H - 24]], fit);
    var path = d3.geoPath(proj);
    var p = function (f) { return proj([f.lng, f.lat]); };

    svg.append('g').selectAll('path').data(all.features).join('path')
      .attr('d', path).attr('stroke', '#fff').attr('stroke-width', 0.8)
      .attr('fill', function (f) { return region.provinces.indexOf(f.properties && f.properties.name) >= 0 ? '#dfe7ea' : '#eef2f3'; });

    var lines = svg.append('g');
    function drawLines() {
      var data = corridors.filter(function (c) { return showProposed || c.status === 'existing'; });
      var sel = lines.selectAll('line').data(data, function (c) { return c.from + c.hub; });
      sel.exit().remove();
      sel.enter().append('line').merge(sel)
        .attr('x1', function (c) { return p(facById[c.from])[0]; })
        .attr('y1', function (c) { return p(facById[c.from])[1]; })
        .attr('x2', function (c) { return p(hubById[c.hub])[0]; })
        .attr('y2', function (c) { return p(hubById[c.hub])[1]; })
        .attr('stroke', function (c) { return c.status === 'existing' ? '#888780' : '#c75c45'; })
        .attr('stroke-width', function (c) { return Math.max(1.5, c.mw / 500); })
        .attr('stroke-dasharray', function (c) { return c.status === 'existing' ? 'none' : '5 4'; })
        .attr('opacity', 0.85);
    }
    drawLines();

    svg.append('g').selectAll('rect').data(hubs).join('rect')
      .attr('x', function (h) { return p(h)[0] - 5; }).attr('y', function (h) { return p(h)[1] - 5; })
      .attr('width', 10).attr('height', 10).attr('fill', '#316d91').attr('stroke', '#fff').attr('stroke-width', 1.5);
    svg.append('g').selectAll('text').data(hubs).join('text')
      .attr('x', function (h) { return p(h)[0] + 9; }).attr('y', function (h) { return p(h)[1] + 4; })
      .text(function (h) { return h.name; }).attr('font-size', 11).attr('fill', '#316d91');

    var rS = d3.scaleSqrt().domain([0, d3.max(window.FAC, window.siteMW)]).range([3.5, 18]);
    svg.append('g').selectAll('a').data(sites.slice().sort(function (a, b) { return window.siteMW(b) - window.siteMW(a); })).join('a')
      .attr('href', function (d) { return 'facility.html?id=' + encodeURIComponent(d.id); })
      .append('circle')
      .attr('cx', function (d) { return p(d)[0]; }).attr('cy', function (d) { return p(d)[1]; })
      .attr('r', function (d) { return rS(window.siteMW(d)); })
      .attr('fill', function (d) { return d.op > 0 ? window.sectorColor(d.sector) : '#fff'; })
      .attr('stroke', function (d) { return d.op > 0 ? '#fff' : window.sectorColor(d.sector); })
      .attr('stroke-width', function (d) { return d.op > 0 ? 1.3 : 2; })
      .append('title').text(function (d) { return d.name + ' — ' + window.siteMW(d).toLocaleString() + ' MW'; });

    document.getElementById('txToggle').addEventListener('click', function () {
      showProposed = !showProposed;
      this.classList.toggle('on', showProposed);
      this.querySelector('span').textContent = t(showProposed ? 'reg_toggle_on' : 'reg_toggle');
      drawLines();
    });
  }).catch(function () {
    document.getElementById('txmap').innerHTML =
      '<div class="sub" style="padding:60px;text-align:center">Map topology unavailable offline.</div>';
  });

  /* operating capacity by site, largest first, capped so busy regions stay readable */
  var chart;
  window.addEventListener('load', function () {
    var sorted = sites.filter(function (f) { return f.op > 0; }).sort(function (a, b) { return b.op - a.op; }).slice(0, MAX_BARS);
    document.getElementById('regChartBox').style.height = Math.max(160, 26 * sorted.length + 50) + 'px';
    chart = new Chart(document.getElementById('regChart'), {
      type: 'bar',
      data: { labels: sorted.map(function (f) { return f.short.length > 34 ? f.short.slice(0, 32) + '…' : f.short; }),
        datasets: [{ label: t('pop_op'), data: sorted.map(function (f) { return f.op; }), borderRadius: 3,
          backgroundColor: sorted.map(function (f) { return window.sectorColor(f.sector); }) }] },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        onClick: function (e, els) { if (els.length) location.href = 'facility.html?id=' + encodeURIComponent(sorted[els[0].index].id); },
        plugins: { legend: { display: false },
          tooltip: { callbacks: { title: function (c) { return sorted[c[0].dataIndex].name; },
            label: function (c) { return c.dataset.label + ': ' + c.raw.toLocaleString() + ' MW'; } } } },
        scales: { x: { ticks: { font: { size: 11 }, callback: function (v) { return v.toLocaleString() + ' MW'; } } },
          y: { ticks: { font: { size: 11 } } } } }
    });
  });

  window.onLangChange = function () {
    render();
    if (chart) { chart.data.datasets[0].label = t('pop_op'); chart.update(); }
  };
  render();
})();
