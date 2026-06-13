/* Home page: national choropleth-less map with facility markers, popup, and filters. */
(function () {
  var W = 960, H = 400;
  var rS = d3.scaleSqrt().domain([0, 3700]).range([5, 18]);
  var svg = d3.select('#map').append('svg')
    .attr('viewBox', '0 0 ' + W + ' ' + H).attr('width', '100%').style('display', 'block');

  var fInd = 'all';
  document.querySelectorAll('.chip[data-ind]').forEach(function (c) {
    c.addEventListener('click', function () {
      fInd = c.dataset.ind;
      document.querySelectorAll('.chip[data-ind]').forEach(function (x) { x.classList.toggle('on', x === c); });
      applyFilter();
    });
  });
  document.getElementById('fRegion').addEventListener('change', applyFilter);
  document.getElementById('fReady').addEventListener('change', applyFilter);

  function applyFilter() {
    var reg = document.getElementById('fRegion').value;
    var rd = document.getElementById('fReady').value;
    svg.selectAll('.mk').style('opacity', function (d) {
      var ok = (fInd === 'all' || d.ind === fInd) &&
               (reg === 'all' || d.region === reg) &&
               (rd === 'all' || d.ready === rd);
      return ok ? 0.92 : 0.08;
    }).style('pointer-events', function (d) {
      var ok = (fInd === 'all' || d.ind === fInd) &&
               (reg === 'all' || d.region === reg) &&
               (rd === 'all' || d.ready === rd);
      return ok ? 'all' : 'none';
    });
  }

  d3.json('https://cdn.jsdelivr.net/npm/datamaps@0.5.10/src/js/data/idn.topo.json').then(function (topo) {
    var feat = topojson.feature(topo, topo.objects.idn);
    var proj = d3.geoMercator().fitSize([W, H], feat);
    var path = d3.geoPath(proj);
    svg.append('g').selectAll('path').data(feat.features).join('path')
      .attr('d', path).attr('fill', '#dfe7ea').attr('stroke', '#fff').attr('stroke-width', 0.7);
    svg.append('g').selectAll('circle').data(window.FAC).join('circle').attr('class', 'mk')
      .attr('cx', function (d) { return proj([d.lng, d.lat])[0]; })
      .attr('cy', function (d) { return proj([d.lng, d.lat])[1]; })
      .attr('r', function (d) { return rS(d.cap); })
      .attr('fill', function (d) { return window.READY[d.ready]; })
      .attr('stroke', '#fff').attr('stroke-width', 1.2).attr('opacity', 0.92)
      .on('click', function (e, d) { openPop(d); });
  }).catch(function () {
    document.getElementById('map').innerHTML =
      '<div style="padding:60px;text-align:center;color:#6b6a78;font-size:13px">Map topology unavailable offline — connect to load the basemap.</div>';
  });

  function t(k) { return (window.I18N[window.CP_LANG || 'en'] || window.I18N.en)[k]; }

  function openPop(d) {
    var html =
      '<button class="x" aria-label="Close" id="popx">&times;</button>' +
      '<div style="font-weight:600;font-size:14px;margin-bottom:1px">' + d.name + '</div>' +
      '<div style="font-size:11.5px;color:#6b6a78;margin-bottom:8px">' + d.prov + '</div>' +
      '<span class="tag t-' + d.ind + '">' + window.IND_NAME[d.ind] + '</span> ' +
      '<span class="pill p-' + d.ready + '">' + d.ready + '</span>' +
      '<div style="margin-top:10px">' +
        '<div class="metarow"><span>' + t('pop_cap') + '</span><b>' + d.cap.toLocaleString() + ' MW</b></div>' +
        '<div class="metarow"><span>' + t('pop_ei') + '</span><b>' + d.ei + ' tCO₂/MWh</b></div>' +
        '<div class="metarow"><span>' + t('pop_cost') + '</span><b>$' + d.cost + 'B</b></div>' +
      '</div>' +
      '<div style="font-size:11px;color:#6b6a78;margin-top:9px">' + t('pop_mix') + '</div>' +
      '<div class="mixbar"><div style="width:' + d.coal + '%;background:#272636"></div>' +
        '<div style="width:' + d.clean + '%;background:#1d9e75"></div></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:10.5px;color:#6b6a78">' +
        '<span>' + d.coal + '% ' + t('pop_coal') + '</span><span>' + d.clean + '% ' + t('pop_clean') + '</span></div>' +
      '<a class="btn block" style="margin-top:11px" href="facility.html?id=' + d.id + '">' + t('pop_view') + ' →</a>';
    var pop = document.getElementById('pop');
    pop.innerHTML = html;
    pop.classList.add('on');
    document.getElementById('popx').addEventListener('click', function () { pop.classList.remove('on'); });
  }
})();
