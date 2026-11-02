/* Region page. Takes ?r=<region key> (default Sulawesi).
   Headline feature: a GRID MAP of the region's captive coal sites with PLN substations (150 kV and
   above, from OpenStreetMap), each site's link to its nearest one, and, where GARUDA results are
   in, the corridors between provinces (GARUDA's lines summed per province pair), marked where the
   model upgrades them; buttons turn the substations and the corridors on and off. Plus a per-site
   operating-capacity chart (colored by sector) and the corridor table. */
(function () {
  var W = 560, H = 460, MAX_BARS = 15, NEAR_KM = 25;
  var key = new URLSearchParams(location.search).get('r');
  var region = window.REGIONS.find(function (r) { return r.key === key; }) || window.REGIONS[0];
  var sites = window.FAC.filter(function (f) { return f.region === region.key; });
  var SUBS = window.SUBSTATIONS || { sites: {}, all: [] };
  var link = sites.filter(function (f) { return SUBS.sites[f.id]; });
  var G = window.GARUDA;
  var corridors = [];
  (region.garuda || []).forEach(function (isl) {
    if (G && G.corridors && G.corridors[isl]) corridors = corridors.concat(G.corridors[isl]);
  });
  /* do the GARUDA runs for this region's corridors exist yet (otherwise only existing capacity) */
  var ran = corridors.some(function (c) { return c.used && Object.keys(c.used).length; });
  var card = window.siteCard(document.getElementById('pop'));

  var t = window.tr;
  var esc = window.esc;

  /* region picker: every region with sites, largest operating capacity first */
  var regions = window.REGIONS.map(function (r) {
    var s = window.FAC.filter(function (f) { return f.region === r.key; });
    return { r: r, n: s.length, op: d3.sum(s, function (f) { return f.op; }) };
  }).filter(function (x) { return x.n; }).sort(function (a, b) { return b.op - a.op; });

  function upgraded(c) { return c.add && Object.keys(c.add).some(function (k) { return c.add[k] > 0; }); }

  function render() {
    var name = window.regionName(region);
    document.getElementById('regName').textContent = name;
    document.title = name + ' · ' + t('nav_region') + ' · CITRA';
    document.getElementById('regPick').innerHTML = '<span class="fl">' + t('f_region') + '</span>' + regions.map(function (x) {
      var on = x.r.key === region.key;
      return '<a class="chip' + (on ? ' on' : '') + '" role="tab" aria-selected="' + on + '" href="region.html?r=' +
        encodeURIComponent(x.r.key) + '">' + esc(window.regionName(x.r)) + ' <span class="mut">' + x.n + '</span></a>';
    }).join('');

    document.getElementById('rsGW').textContent = (d3.sum(sites, function (f) { return f.op; }) / 1000).toFixed(1) + ' GW';
    document.getElementById('rsSites').textContent = sites.length;
    var near = link.filter(function (f) { return !SUBS.sites[f.id].sea && SUBS.sites[f.id].km <= NEAR_KM; }).length;
    document.getElementById('rsConn').textContent = link.length ? near + ' / ' + link.length : '—';
    var cost = d3.sum(link, function (f) { return SUBS.sites[f.id].costM || 0; });
    document.getElementById('rsCapex').textContent = link.length ? '$' + Math.round(cost) + 'm' : '—';

    /* corridors between provinces: upgraded ones first */
    document.getElementById('txCard').style.display = corridors.length ? '' : 'none';
    document.getElementById('regGrid').style.gridTemplateColumns = corridors.length ? '' : '1fr';
    document.getElementById('tgCorr').style.display = corridors.length ? '' : 'none';
    document.getElementById('txBody').innerHTML = corridors.slice().sort(function (a, b) {
      return upgraded(b) - upgraded(a) || b.mw - a.mw;
    }).map(function (c) {
      var up = !ran ? '<span class="mut">—</span>'
        : upgraded(c) ? Object.keys(c.add).filter(function (k) { return c.add[k] > 0; }).map(function (k) {
          return t('up_mw').replace('{mw}', Math.round(c.add[k]).toLocaleString()).replace('{path}', t('up_' + k));
        }).join('; ') : '<span class="mut">' + t('up_no') + '</span>';
      return '<tr><td>' + esc(c.a) + ' ↔ ' + esc(c.b) + '</td>' +
        '<td style="text-align:right">' + Math.round(c.mw).toLocaleString() + '</td><td>' + up + '</td></tr>';
    }).join('');
    document.querySelectorAll('.txleg').forEach(function (el, i) {  /* the upgrade key only once runs are in */
      el.style.display = corridors.length && (i === 0 || ran) ? '' : 'none';
    });

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

    /* PLN substations in the region's provinces; each province's corridor end sits at the middle
       of its substations (its grid), or at the province centroid if it has none */
    var byProv = {};
    var subs = SUBS.all.map(function (s) { return { lat: s[0], lng: s[1], kv: s[2], name: s[3] }; }).filter(function (s) {
      var f = land.features.find(function (f) { return d3.geoContains(f, [s.lng, s.lat]); });
      if (f) (byProv[f.properties.name] = byProv[f.properties.name] || []).push(s);
      return !!f;
    });
    function anchor(prov) {
      var s = byProv[prov];
      if (s && s.length) return proj([d3.mean(s, function (x) { return x.lng; }), d3.mean(s, function (x) { return x.lat; })]);
      var f = land.features.find(function (f) { return f.properties.name === prov; });
      if (f) return proj(d3.geoCentroid(f));
      return window.PROVINCE_POINTS[prov] ? proj(window.PROVINCE_POINTS[prov]) : null;
    }

    var gCorr = svg.append('g'), gSubs = svg.append('g');
    var wS = d3.scaleSqrt().domain([0, d3.max(corridors, function (c) { return c.mw; }) || 1]).range([1.5, 9]);
    gCorr.selectAll('line').data(corridors.filter(function (c) { return anchor(c.a) && anchor(c.b); })).join('line')
      .attr('x1', function (c) { return anchor(c.a)[0]; }).attr('y1', function (c) { return anchor(c.a)[1]; })
      .attr('x2', function (c) { return anchor(c.b)[0]; }).attr('y2', function (c) { return anchor(c.b)[1]; })
      .attr('stroke', function (c) { return upgraded(c) ? '#c75c45' : '#9aa3a9'; })
      .attr('stroke-width', function (c) { return wS(c.mw); }).attr('stroke-linecap', 'round').attr('opacity', 0.8)
      .append('title').text(function (c) { return c.a + ' ↔ ' + c.b + ' · ' + Math.round(c.mw) + ' MW'; });

    gSubs.append('g').selectAll('line').data(link.filter(function (f) { return SUBS.sites[f.id].km >= 1; })).join('line')
      .attr('x1', function (f) { return p(f)[0]; }).attr('y1', function (f) { return p(f)[1]; })
      .attr('x2', function (f) { return p(SUBS.sites[f.id])[0]; }).attr('y2', function (f) { return p(SUBS.sites[f.id])[1]; })
      .attr('stroke', '#316d91').attr('stroke-width', 1.2).attr('stroke-dasharray', '4 3').attr('opacity', 0.8);

    gSubs.append('g').selectAll('rect').data(subs).join('rect')
      .attr('x', function (s) { return p(s)[0] - 2.5; }).attr('y', function (s) { return p(s)[1] - 2.5; })
      .attr('width', 5).attr('height', 5).attr('fill', '#316d91').attr('opacity', 0.75)
      .append('title').text(function (s) { return (s.name || '') + ' · ' + s.kv + ' kV'; });

    var rS = d3.scaleSqrt().domain([0, d3.max(window.FAC, window.siteMW)]).range([3.5, 18]);
    svg.append('g').selectAll('circle').data(sites.slice().sort(function (a, b) { return window.siteMW(b) - window.siteMW(a); })).join('circle')
      .attr('class', 'mk')
      .attr('cx', function (d) { return p(d)[0]; }).attr('cy', function (d) { return p(d)[1]; })
      .attr('r', function (d) { return rS(window.siteMW(d)); })
      .attr('fill', function (d) { return d.op > 0 ? window.sectorColor(d.sector) : '#fff'; })
      .attr('stroke', function (d) { return d.op > 0 ? '#fff' : window.sectorColor(d.sector); })
      .attr('stroke-width', function (d) { return d.op > 0 ? 1.3 : 2; })
      .call(card.bind);
    svg.on('click', function () { card.hide(); });

    /* map layer buttons */
    [['tgSubs', gSubs], ['tgCorr', gCorr]].forEach(function (b) {
      document.getElementById(b[0]).addEventListener('click', function () {
        var on = !this.classList.contains('on');
        this.classList.toggle('on', on);
        this.setAttribute('aria-pressed', on);
        b[1].style('display', on ? null : 'none');
      });
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
    card.refresh();
    if (chart) { chart.data.datasets[0].label = t('pop_op'); chart.update(); }
  };
  render();
})();
