(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('motion');

  // Franja de disciplinas en movimiento continuo
  const strip = document.querySelector('.discipline-strip');
  if (strip) {
    const track = document.createElement('div');
    track.className = 'marquee-track';
    const group = () => {
      const g = document.createElement('div');
      g.className = 'marquee-group';
      strip.querySelectorAll(':scope > span, :scope > b').forEach(el => g.appendChild(el.cloneNode(true)));
      g.appendChild(Object.assign(document.createElement('b'), { textContent: '✳' }));
      return g;
    };
    const first = group(), second = group();
    second.setAttribute('aria-hidden', 'true');
    track.append(first, second);
    strip.replaceChildren(track);
    strip.classList.add('is-marquee');
  }

  // Frase final palabra por palabra
  const statement = document.querySelector('.statement p');
  if (statement) {
    let i = 0;
    const wrap = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part.trim()) return frag.append(part);
            const w = document.createElement('span');
            w.className = 'word';
            w.style.setProperty('--i', i++);
            w.textContent = part;
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') wrap(child);
      });
    };
    wrap(statement);
  }

  // Aparición al hacer scroll
  const targets = document.querySelectorAll(
    '.section-label, .section h2, .manifest-text p, .signature, .project-card, .service-list article, ' +
    '.archive figure, .team-grid article, .statement, .contact form, .contact .email, .services-link'
  );
  targets.forEach(el => {
    el.classList.add('reveal');
    const siblings = [...el.parentElement.children].filter(s => s.matches('article, figure'));
    const idx = siblings.indexOf(el);
    if (idx > 0) el.style.setProperty('--delay', `${idx * 110}ms`);
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  targets.forEach(el => io.observe(el));

  // Emblema del hero sigue suavemente al cursor
  const emblem = document.querySelector('.hero-emblem img');
  if (emblem && matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', e => {
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      emblem.style.setProperty('--tx', `${x * 18}px`);
      emblem.style.setProperty('--ty', `${y * 18}px`);
    }, { passive: true });
  }
})();
