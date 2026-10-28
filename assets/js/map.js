/* Home page: national map of captive coal sites with filters, headline stats and a popup. */
(function () {
  var W = 960, H = 400;
  var maxMW = d3.max(window.FAC, window.siteMW);
  var rS = d3.scaleSqrt().domain([0, maxMW]).range([3.5, 18]);
  var svg = d3.select('#map').append('svg')
    .attr('viewBox', '0 0 ' + W + ' ' + H).attr('width', '100%').style('display', 'block');

  function t(k) { return (window.I18N[window.CP_LANG || 'en'] || window.I18N.en)[k]; }
  function mw(v) { return Math.round(v).toLocaleString() + ' MW'; }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  /* headline stats */
  var opMW = d3.sum(window.FAC, function (f) { return f.op; });
  var smMW = d3.sum(window.FAC.filter(function (f) { return f.region === 'Sulawesi' || f.region === 'Maluku'; }),
    function (f) { return f.op; });
  document.getElementById('statSites').textContent = window.FAC.length;
  document.getElementById('statGW').textContent = (opMW / 1000).toFixed(1) + ' GW';
  document.getElementById('statSM').textContent = Math.round(smMW / opMW * 100) + '%';

  /* sector chips */
  var fInd = 'all';
  var chipBox = document.getElementById('sectorChips');
  function renderChips() {
    chipBox.innerHTML = Object.keys(window.SECTORS).map(function (s) {
      return '<button class="chip' + (fInd === s ? ' on' : '') + '" data-ind="' + s + '">' + window.sectorName(s) + '</button>';
    }).join('');
  }
  renderChips();
  document.querySelector('.filters').addEventListener('click', function (e) {
    var c = e.target.closest('.chip[data-ind]');
    if (!c) return;
    fInd = c.dataset.ind;
    document.querySelectorAll('.chip[data-ind]').forEach(function (x) { x.classList.toggle('on', x === c); });
    applyFilter();
  });
  document.getElementById('fRegion').addEventListener('change', applyFilter);
  document.getElementById('fStatus').addEventListener('change', applyFilter);
  document.getElementById('fSearch').addEventListener('input', applyFilter);

  function visible(d) {
    var reg = document.getElementById('fRegion').value;
    var st = document.getElementById('fStatus').value;
    var q = document.getElementById('fSearch').value.trim().toLowerCase();
    return (!q || [d.name, d.owner, d.prov, d.regency].join(' ').toLowerCase().indexOf(q) >= 0) &&
           (fInd === 'all' || d.sector === fInd) &&
           (reg === 'all' || d.region === reg) &&
           (st === 'all' || (st === 'op' && d.op > 0) || (st === 'pipe' && d.con + d.plan > 0) ||
            (st === 'model' && d.model.length > 0));
  }
  function applyFilter() {
    svg.selectAll('.mk')
      .style('opacity', function (d) { return visible(d) ? 0.9 : 0.06; })
      .style('pointer-events', function (d) { return visible(d) ? 'all' : 'none'; });
    renderTable();
  }

  /* sortable site table, following the same filters as the map */
  var sortKey = 'total', sortDir = -1;
  var SORT = {
    name: function (d) { return d.name.toLowerCase(); },
    sector: function (d) { return window.sectorName(d.sector); },
    prov: function (d) { return d.prov; },
    op: function (d) { return d.op; },
    pipe: function (d) { return d.con + d.plan; },
    owner: function (d) { return d.owner.toLowerCase(); },
    model: function (d) { return d.model.length; },
    total: window.siteMW
  };
  function renderTable() {
    var rows = window.FAC.filter(visible).sort(function (a, b) {
      var x = SORT[sortKey](a), y = SORT[sortKey](b);
      return (x < y ? -1 : x > y ? 1 : 0) * sortDir;
    });
    document.getElementById('tblCount').textContent = rows.length + ' / ' + window.FAC.length + ' ' + t('tbl_count');
    document.getElementById('siteBody').innerHTML = rows.map(function (d) {
      return '<tr><td><a href="facility.html?id=' + d.id + '">' + esc(d.name) + '</a><br><span class="mut" style="font-size:11.5px">' +
          t(d.kind === 'park' ? 'kind_park' : 'kind_plant') + '</span></td>' +
        '<td><span class="tag"><i class="dot" style="background:' + window.sectorColor(d.sector) + '"></i>' + window.sectorName(d.sector) + '</span></td>' +
        '<td>' + esc(d.prov) + '</td>' +
        '<td style="text-align:right;font-weight:600">' + (d.op ? d.op.toLocaleString() : '—') + '</td>' +
        '<td style="text-align:right">' + (d.con + d.plan ? (d.con + d.plan).toLocaleString() : '—') + '</td>' +
        '<td>' + esc(d.owner) + ' <span class="mut">(' + esc(d.ownerCountry) + ')</span></td>' +
        '<td>' + t(d.model.length ? 'yes' : 'no') + '</td></tr>';
    }).join('');
    document.querySelectorAll('table.sortable th[data-sort]').forEach(function (th) {
      th.classList.toggle('asc', th.dataset.sort === sortKey && sortDir > 0);
      th.classList.toggle('desc', th.dataset.sort === sortKey && sortDir < 0);
    });
  }
  document.querySelectorAll('table.sortable th[data-sort]').forEach(function (th) {
    th.addEventListener('click', function () {
      var k = th.dataset.sort, numeric = k === 'op' || k === 'pipe' || k === 'model';
      sortDir = k === sortKey ? -sortDir : (numeric ? -1 : 1);
      sortKey = k;
      renderTable();
    });
  });
  renderTable(); /* don't wait for the basemap */

  window.onLangChange = function () { renderChips(); renderTable(); };

  d3.json('https://cdn.jsdelivr.net/npm/datamaps@0.5.10/src/js/data/idn.topo.json').then(function (topo) {
    var feat = topojson.feature(topo, topo.objects.idn);
    var proj = d3.geoMercator().fitSize([W, H], feat);
    var path = d3.geoPath(proj);
    svg.append('g').selectAll('path').data(feat.features).join('path')
      .attr('d', path).attr('fill', '#dfe7ea').attr('stroke', '#fff').attr('stroke-width', 0.7);
    /* largest first so small sites stay clickable on top */
    var data = window.FAC.slice().sort(function (a, b) { return window.siteMW(b) - window.siteMW(a); });
    svg.append('g').selectAll('circle').data(data).join('circle').attr('class', 'mk')
      .attr('cx', function (d) { return proj([d.lng, d.lat])[0]; })
      .attr('cy', function (d) { return proj([d.lng, d.lat])[1]; })
      .attr('r', function (d) { return rS(window.siteMW(d)); })
      .attr('fill', function (d) { return d.op > 0 ? window.sectorColor(d.sector) : '#fff'; })
      .attr('stroke', function (d) { return d.op > 0 ? '#fff' : window.sectorColor(d.sector); })
      .attr('stroke-width', function (d) { return d.op > 0 ? 1.2 : 2; })
      .attr('opacity', 0.9)
      .on('click', function (e, d) { openPop(d); })
      .append('title').text(function (d) { return d.name + ' — ' + mw(window.siteMW(d)); });
    applyFilter();
  }).catch(function () {
    document.getElementById('map').innerHTML =
      '<div style="padding:60px;text-align:center;color:#6b6a78;font-size:13px">Map topology unavailable offline — connect to load the basemap.</div>';
  });

  function openPop(d) {
    var place = d.prov + (d.regency ? ' · ' + d.regency : '');
    var html =
      '<button class="x" aria-label="Close" id="popx">&times;</button>' +
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
      '<a class="btn block" style="margin-top:11px" href="facility.html?id=' + d.id + '">' + t('pop_view') + ' →</a>';
    var pop = document.getElementById('pop');
    pop.innerHTML = html;
    pop.classList.add('on');
    document.getElementById('popx').addEventListener('click', function () { pop.classList.remove('on'); });
  }
})();
