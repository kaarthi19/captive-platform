/* Region page (Sulawesi).
   Headline feature: a TRANSMISSION MAP — Sulawesi basemap with captive parks, PLN grid hubs,
   and the corridors that would connect them, with a toggle for proposed vs existing lines.
   Plus a per-site operating-capacity chart (colored by sector) and the upgrades table. */
(function () {
  var W = 560, H = 460;
  var sulFac = window.FAC.filter(function (f) { return f.region === 'Sulawesi'; });
  var hubById = {}; window.HUBS.forEach(function (h) { hubById[h.id] = h; });
  var facById = {}; window.FAC.forEach(function (f) { facById[f.id] = f; });
  var showProposed = true;

  /* headline stats + upgrades table (corridors are illustrative until GARUDA results load) */
  var proposed = window.CORRIDORS.filter(function (c) { return c.status === 'proposed' && facById[c.from]; });
  document.getElementById('rsGW').textContent = (d3.sum(sulFac, function (f) { return f.op; }) / 1000).toFixed(1) + ' GW';
  document.getElementById('rsSites').textContent = sulFac.length;
  document.getElementById('rsConn').textContent = (d3.sum(proposed, function (c) { return c.mw; }) / 1000).toFixed(1) + ' GW';
  document.getElementById('rsCapex').textContent = '$' + d3.sum(proposed, function (c) { return c.cost; }).toFixed(1) + 'B';
  document.getElementById('txBody').innerHTML = proposed.map(function (c) {
    return '<tr><td>' + facById[c.from].short + ' ↔ ' + hubById[c.hub].name + ' ' + c.kv + ' kV</td>' +
      '<td style="text-align:right">' + c.mw.toLocaleString() + '</td>' +
      '<td style="text-align:right">$' + c.cost.toFixed(1) + 'B</td></tr>';
  }).join('');

  var svg = d3.select('#txmap').append('svg')
    .attr('viewBox', '0 0 ' + W + ' ' + H).attr('width', '100%').style('display', 'block');

  d3.json('https://cdn.jsdelivr.net/npm/datamaps@0.5.10/src/js/data/idn.topo.json').then(function (topo) {
    var all = topojson.feature(topo, topo.objects.idn);
    var sul = { type: 'FeatureCollection', features: all.features.filter(function (f) {
      var n = (f.properties && f.properties.name) || '';
      return /Sulawesi|Gorontalo/i.test(n);
    }) };
    var proj = d3.geoMercator().fitExtent([[20, 20], [W - 20, H - 20]], sul);
    var path = d3.geoPath(proj);

    svg.append('g').selectAll('path').data(sul.features).join('path')
      .attr('d', path).attr('fill', '#e3eaed').attr('stroke', '#fff').attr('stroke-width', 0.8);

    /* corridors */
    var lines = svg.append('g').attr('class', 'corridors');
    function drawLines() {
      var data = window.CORRIDORS.filter(function (c) { return facById[c.from] && facById[c.from].region === 'Sulawesi'; })
        .filter(function (c) { return showProposed || c.status === 'existing'; });
      var sel = lines.selectAll('line').data(data, function (c) { return c.from + c.hub; });
      sel.exit().remove();
      sel.enter().append('line').merge(sel)
        .attr('x1', function (c) { return proj([facById[c.from].lng, facById[c.from].lat])[0]; })
        .attr('y1', function (c) { return proj([facById[c.from].lng, facById[c.from].lat])[1]; })
        .attr('x2', function (c) { return proj([hubById[c.hub].lng, hubById[c.hub].lat])[0]; })
        .attr('y2', function (c) { return proj([hubById[c.hub].lng, hubById[c.hub].lat])[1]; })
        .attr('stroke', function (c) { return c.status === 'existing' ? '#888780' : '#fc4d50'; })
        .attr('stroke-width', function (c) { return Math.max(1.5, c.mw / 500); })
        .attr('stroke-dasharray', function (c) { return c.status === 'existing' ? 'none' : '5 4'; })
        .attr('opacity', 0.85);
    }
    drawLines();

    /* hubs (squares) */
    svg.append('g').selectAll('rect').data(window.HUBS).join('rect')
      .attr('x', function (h) { return proj([h.lng, h.lat])[0] - 5; })
      .attr('y', function (h) { return proj([h.lng, h.lat])[1] - 5; })
      .attr('width', 10).attr('height', 10).attr('fill', '#378add').attr('stroke', '#fff').attr('stroke-width', 1.5);
    svg.append('g').selectAll('text.hub').data(window.HUBS).join('text').attr('class', 'hub')
      .attr('x', function (h) { return proj([h.lng, h.lat])[0] + 9; })
      .attr('y', function (h) { return proj([h.lng, h.lat])[1] + 4; })
      .text(function (h) { return h.name; }).attr('font-size', 11).attr('fill', '#185fa5');

    /* parks (circles) */
    var rS = d3.scaleSqrt().domain([0, d3.max(sulFac, window.siteMW)]).range([4, 16]);
    svg.append('g').selectAll('circle').data(sulFac.slice().sort(function (a, b) { return window.siteMW(b) - window.siteMW(a); })).join('circle')
      .attr('cx', function (d) { return proj([d.lng, d.lat])[0]; })
      .attr('cy', function (d) { return proj([d.lng, d.lat])[1]; })
      .attr('r', function (d) { return rS(window.siteMW(d)); })
      .attr('fill', function (d) { return window.sectorColor(d.sector); })
      .attr('stroke', '#fff').attr('stroke-width', 1.3).style('cursor', 'pointer')
      .on('click', function (e, d) { location.href = 'facility.html?id=' + d.id; })
      .append('title').text(function (d) { return d.name + ' — ' + window.siteMW(d).toLocaleString() + ' MW'; });

    document.getElementById('txToggle').addEventListener('click', function () {
      showProposed = !showProposed;
      this.classList.toggle('on', showProposed);
      this.querySelector('span').textContent = showProposed ? 'Proposed upgrades shown' :
        ((window.I18N[window.CP_LANG || 'en'] || window.I18N.en).reg_toggle);
      drawLines();
    });
  }).catch(function () {
    document.getElementById('txmap').innerHTML =
      '<div style="padding:60px;text-align:center;color:#6b6a78;font-size:13px">Map topology unavailable offline.</div>';
  });

  /* capacity / readiness chart */
  window.addEventListener('load', function () {
    var sorted = sulFac.filter(function (f) { return f.op > 0; }).sort(function (a, b) { return b.op - a.op; });
    new Chart(document.getElementById('regChart'), {
      type: 'bar',
      data: { labels: sorted.map(function (f) { return f.short; }),
        datasets: [{ label: 'Operating', data: sorted.map(function (f) { return f.op; }),
          backgroundColor: sorted.map(function (f) { return window.sectorColor(f.sector); }) }] },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { font: { size: 11 }, callback: function (v) { return v + ' MW'; } } }, y: { ticks: { font: { size: 11 } } } } }
    });
  });
})();
