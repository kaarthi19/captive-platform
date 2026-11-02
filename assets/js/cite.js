/* "Cite this platform" on the methodology page, in the OREO style: an APA 7 data set citation with
   the lab (and its university) as author, and the same as BibTeX. The version is the date of the
   last GARUDA results build (results.js), so a citation points at the results as they were then;
   the URL is wherever the site is served from, so it follows the site if it moves. */
(function () {
  var AUTHOR = 'Power Transformation Lab, University of California San Diego';
  var TITLE = 'CITRA: Captive Industry Transition Roadmap Atlas';
  var version = (window.GARUDA && window.GARUDA.built) || new Date(document.lastModified).toISOString().slice(0, 10);
  var year = version.slice(0, 4);
  var url = location.origin + location.pathname.replace(/[^/]*$/, '');
  var esc = window.esc;
  var apa = AUTHOR + '. (' + year + '). ' + TITLE + ' (Version ' + version + ') [Data set]. ' + url;
  var bib = ['@misc{ptl_citra_' + version.replace(/-/g, '') + ',',
    '  author       = {{' + AUTHOR + '}},',
    '  title        = {' + TITLE + '},',
    '  year         = {' + year + '},',
    '  version      = {' + version + '},',
    '  howpublished = {Data set},',
    '  url          = {' + url + '}',
    '}'].join('\n');

  var box = document.getElementById('citeText'), copy = document.getElementById('citeCopy');
  var tabs = { apa: document.getElementById('citeApa'), bib: document.getElementById('citeBib') };
  var format = 'apa';
  function show() {
    /* APA style: the title in italics and the URL as a link; the copied text is plain */
    box.innerHTML = format === 'apa'
      ? esc(AUTHOR) + '. (' + year + '). <i>' + esc(TITLE) + '</i> (Version ' + version + ') [Data set]. <a href="' + esc(url) + '">' + esc(url) + '</a>'
      : esc(bib);
    box.classList.toggle('bib', format === 'bib');
    Object.keys(tabs).forEach(function (k) {
      tabs[k].classList.toggle('on', k === format);
      tabs[k].setAttribute('aria-selected', k === format);
    });
  }
  Object.keys(tabs).forEach(function (k) { tabs[k].addEventListener('click', function () { format = k; show(); }); });
  copy.addEventListener('click', function () {
    var label = copy.querySelector('span');
    navigator.clipboard.writeText(format === 'apa' ? apa : bib).then(function () {
      label.textContent = window.tr('m_cite_copied');
      setTimeout(function () { label.textContent = window.tr('m_cite_copy'); }, 1600);
    }, function () { label.textContent = window.tr('m_cite_copy'); });
  });
  show();
})();
