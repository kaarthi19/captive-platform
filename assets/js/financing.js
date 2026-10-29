/* Financing page: disclosed debt financing for a site's captive coal units — summary, lenders,
   and the loan list. Takes ?id=<site>. */
(function () {
  var fac = window.getFac(new URLSearchParams(location.search).get('id'));
  var loans = window.SITE_DETAILS[fac.id].finance;
  var esc = window.esc;
  var KIND = { commercial: 'lt_commercial', policy: 'lt_policy', mdb: 'lt_mdb', dfi: 'lt_dfi' };

  var t = window.tr;
  function count(list) {  /* [[value, n], ...] by n desc */
    var c = {};
    list.forEach(function (v) { if (v) c[v] = (c[v] || 0) + 1; });
    return Object.keys(c).map(function (k) { return [k, c[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
  }
  function counted(pairs, label) {
    return pairs.length ? pairs.map(function (p) { return esc(label ? label(p[0]) : p[0]) + ' <span class="mut">' + p[1] + '</span>'; }).join(' · ') : '—';
  }

  /* one row per lender, across all of this site's loans */
  var lenders = {}, order = [];
  loans.forEach(function (l) {
    l.lenders.forEach(function (x) {
      if (!lenders[x[0]]) { lenders[x[0]] = { name: x[0], country: x[1], n: 0, years: [] }; order.push(x[0]); }
      var r = lenders[x[0]];
      r.n += 1;
      r.country = r.country || x[1];
      if (l.year) r.years.push(l.year);
    });
  });
  var lenderRows = order.map(function (k) { return lenders[k]; })
    .sort(function (a, b) { return (b.n - a.n) || (a.name < b.name ? -1 : 1); });

  function render() {
    document.getElementById('finName').textContent = fac.name;
    document.title = fac.short + ' · ' + t('fin_kick') + ' · Captive Power Platform';
    document.getElementById('backFac').href = 'facility.html?id=' + encodeURIComponent(fac.id);
    document.getElementById('finMeta').textContent = [fac.prov, window.sectorName(fac.sector),
      t(fac.kind === 'park' ? 'kind_park' : 'kind_plant')].join(' · ');

    var none = !loans.length;
    document.getElementById('lenderCard').style.display = none ? 'none' : '';
    document.getElementById('loanCard').style.display = none ? 'none' : '';
    if (none) {
      document.getElementById('finStats').innerHTML = '';
      document.getElementById('finFacts').innerHTML = '<dd class="mut" style="grid-column:1/-1">' + t('fin_none') + '</dd>';
      return;
    }

    var total = loans.reduce(function (a, l) { return a + (l.usd || 0); }, 0);
    var years = loans.map(function (l) { return l.year; }).filter(Boolean);
    var y0 = Math.min.apply(null, years), y1 = Math.max.apply(null, years);
    document.getElementById('finStats').innerHTML = [
      [loans.length, t('own_loans')],
      ['$' + Math.round(total).toLocaleString() + 'm', t('fin_total') + (loans.some(function (l) { return !l.usd; }) ? ' · ' + t('fin_some_na') : '')],
      [years.length ? (y0 === y1 ? y0 : y0 + '–' + y1) : '—', t('th_years')],
      [lenderRows.length, t('fin_nlenders')]
    ].map(function (s) { return '<div class="stat"><b>' + s[0] + '</b><small>' + s[1] + '</small></div>'; }).join('');

    var earmarked = loans.filter(function (l) { return l.captive; }).length;
    var facts = [
      ['k_lcountry', counted(count([].concat.apply([], loans.map(function (l) {
        return l.lenders.map(function (x) { return x[1]; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
      }))))],
      ['k_ltype', counted(count([].concat.apply([], loans.map(function (l) { return l.kinds; }))), function (k) { return t(KIND[k]); })],
      ['k_structure', counted(count(loans.map(function (l) { return l.type; })))],
      ['k_currency', counted(count(loans.map(function (l) { return l.currency; })))],
      ['k_earmark', earmarked + ' / ' + loans.length]
    ];
    document.getElementById('finFacts').innerHTML = facts.map(function (f) {
      return '<dt>' + t(f[0]) + '</dt><dd>' + f[1] + '</dd>';
    }).join('');

    document.getElementById('lenderBody').innerHTML = lenderRows.map(function (r) {
      var ys = r.years.length ? Math.min.apply(null, r.years) + (Math.max.apply(null, r.years) !== Math.min.apply(null, r.years) ? '–' + Math.max.apply(null, r.years) : '') : '—';
      return '<tr><td>' + esc(r.name) + '</td><td>' + esc(r.country || '—') + '</td>' +
        '<td style="text-align:right;font-weight:600">' + r.n + '</td><td>' + ys + '</td></tr>';
    }).join('');

    document.getElementById('loanBody').innerHTML = loans.map(function (l) {
      return '<tr><td style="text-align:right">' + (l.year || '—') + '</td>' +
        '<td>' + l.lenders.map(function (x) { return esc(x[0]) + (x[1] ? ' <span class="mut">(' + esc(x[1]) + ')</span>' : ''); }).join('<br>') + '</td>' +
        '<td style="text-align:right;font-weight:600">' + (l.usd ? l.usd.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—') +
          (l.currency && l.currency !== 'USD' ? '<br><span class="mut">' + t('fin_orig') + ' ' + esc(l.currency) + '</span>' : '') + '</td>' +
        '<td>' + esc(l.type) + (l.term ? ' · ' + l.term + ' ' + t('fin_yrs') : '') +
          (l.captive ? '' : '<br><span class="mut">' + t('fin_indirect') + '</span>') + '</td>' +
        '<td>' + esc(l.recipient || '—') + (l.sponsor ? '<br><span class="mut">' + esc(l.sponsor) + '</span>' : '') + '</td>' +
        '<td>' + l.refs.map(function (r, i) { return '<a href="' + esc(r) + '" target="_blank" rel="noopener">[' + (i + 1) + ']</a>'; }).join(' ') + '</td></tr>';
    }).join('');
  }

  window.onLangChange = render;
  render();
})();
