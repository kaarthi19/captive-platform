/* Ownership page: who ultimately owns a site's captive coal, the ownership profile, and the
   chain from operator to ultimate owner for each group of units. Takes ?id=<site>. */
(function () {
  var fac = window.getFac(new URLSearchParams(location.search).get('id'));
  var det = window.SITE_DETAILS[fac.id];
  var esc = window.esc;
  var LIVE = { 'Operating': 1, 'Construction': 1, 'Pre-Construction': 1, 'Announced': 1 };
  var OWNERSHIP = { POE: 'own_poe', SOE: 'own_soe', Mixed: 'own_mixed', Public: 'own_public' };

  var t = window.tr;
  function uniq(list) { return list.filter(function (v, i) { return v && list.indexOf(v) === i; }); }
  function splitList(v) { return String(v || '').split(';').map(function (x) { return x.trim(); }).filter(Boolean); }

  var byName = {};
  det.owners.forEach(function (o) { byName[o.name] = o; });

  /* units with the same plant and the same ownership chain collapse into one row */
  var chains = [], chainKey = {};
  det.units.forEach(function (u) {
    var k = [u.plant, u.operator, u.owner, u.parent, JSON.stringify(u.ultimate)].join('|');
    if (!chainKey[k]) chainKey[k] = chains[chains.push({ u: u, n: 0, mw: 0, live: false }) - 1];
    var c = chainKey[k];
    c.n += 1;
    c.mw += u.mw;
    c.live = c.live || !!LIVE[u.status];
  });
  /* live chains first, then by plant (largest plant first), then by size within a plant */
  var plantMW = {};
  chains.forEach(function (c) { plantMW[c.u.plant] = (plantMW[c.u.plant] || 0) + c.mw; });
  chains.sort(function (a, b) {
    return (b.live - a.live) || (plantMW[b.u.plant] - plantMW[a.u.plant]) ||
      (a.u.plant < b.u.plant ? -1 : a.u.plant > b.u.plant ? 1 : 0) || (b.mw - a.mw);
  });

  function render() {
    document.getElementById('ownName').textContent = fac.name;
    document.title = fac.short + ' · ' + t('own_kick') + ' · Captive Power Platform';
    document.getElementById('backFac').href = 'facility.html?id=' + encodeURIComponent(fac.id);
    document.getElementById('ownMeta').textContent = [fac.prov, window.sectorName(fac.sector),
      t(fac.kind === 'park' ? 'kind_park' : 'kind_plant')].join(' · ');

    document.getElementById('ownBody').innerHTML = det.owners.length ? det.owners.map(function (o) {
      return '<tr><td>' + window.ownerLink(o) + '</td>' +
        '<td>' + esc(o.country || '—') + '</td>' +
        '<td><div class="sharebar"><i style="width:' + Math.min(100, o.share) + '%"></i></div>' +
          '<span class="sharepct">' + o.share.toFixed(o.share < 10 ? 1 : 0) + '%</span></td>' +
        '<td style="text-align:right;font-weight:600">' + o.mw.toLocaleString() + '</td>' +
        '<td class="mut">' + esc(o.plants.join(', ')) + '</td></tr>';
    }).join('') : '<tr><td colspan="5" class="mut">' + t('own_none') + '</td></tr>';

    var countries = uniq(det.owners.map(function (o) { return o.country; }));
    var china = uniq([].concat.apply([], det.units.map(function (u) { return splitList(u.china); })));
    var facts = [
      ['k_ownership', det.ownership.map(function (o) { return t(OWNERSHIP[o]) || esc(o); }).join(', ') + (det.jv ? ' · ' + t('k_jv') : '')],
      ['k_countries', countries.length ? esc(countries.join(', ')) : '—'],
      ['k_china', china.length ? esc(china.join(', ')) : '—'],
      ['k_epc', det.epc.length ? det.epc.map(esc).join('<br>') : '—'],
      ['own_fin', det.finance.length
        ? det.finance.length + ' ' + t('own_loans') + ' · <a href="financing.html?id=' + encodeURIComponent(fac.id) + '">' + t('own_seefin') + ' →</a>'
        : '—']
    ];
    document.getElementById('ownFacts').innerHTML = facts.map(function (f) {
      return '<dt>' + t(f[0]) + '</dt><dd>' + f[1] + '</dd>';
    }).join('');

    document.getElementById('chainBody').innerHTML = chains.map(function (c) {
      var u = c.u;
      var ult = u.ultimate.map(function (x) {
        var o = byName[x[0]] || { name: x[0] };
        return window.ownerLink(o) + (x[1] != null ? ' <span class="mut">(' + x[1] + '%)</span>' : '');
      }).join('<br>');
      return '<tr' + (c.live ? '' : ' class="off"') + '>' +
        '<td><b>' + esc(u.plant) + '</b><br><span class="mut">' + c.n + ' ' + t(c.n === 1 ? 'unit_one' : 'units_lc') + ' · ' +
          Math.round(c.mw).toLocaleString() + ' MW' + (c.live ? '' : ' · ' + t('own_inactive')) + '</span></td>' +
        '<td>' + esc(u.operator || '—') + '</td>' +
        '<td>' + esc(u.owner || '—') + '</td>' +
        '<td>' + splitList(u.parent).map(esc).join('<br>') + (u.parent ? '' : '—') + '</td>' +
        '<td>' + (ult || '—') + '</td></tr>';
    }).join('');
  }

  window.onLangChange = render;
  render();
})();
