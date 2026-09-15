/* Restrained, one-time section reveals for the stakeholder homepage. */
(function () {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  sections.forEach(function (section) { section.classList.add('reveal-ready'); });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('reveal-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -36px' });

  sections.forEach(function (section) { observer.observe(section); });
})();
