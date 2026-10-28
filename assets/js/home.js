/* Restrained, one-time section reveals for the stakeholder homepage. */
(function () {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* Only sections that start below the fold fade in; anything already on screen at load paints
     immediately instead of waiting for the observer. */
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]')).filter(function (section) {
    return section.getBoundingClientRect().top > window.innerHeight;
  });
  sections.forEach(function (section) { section.classList.add('reveal-ready'); });

  /* threshold 0: reveal as soon as any part is on screen. A ratio threshold never fires for
     sections taller than about 12x the viewport (the explorer, with its site table). */
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('reveal-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -36px' });

  sections.forEach(function (section) { observer.observe(section); });
})();
