(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('motion');

  // Franjas de texto en movimiento continuo
  document.querySelectorAll('.discipline-strip, .battle-ticker').forEach(strip => {
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
  });

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
  const targets = document.querySelectorAll([
    '.section:not(.service-intro):not(.inc-hero) > .section-label',
    '.section:not(.service-intro):not(.inc-hero) h2',
    '.manifest-text p', '.signature', '.project-card', '.service-list article',
    '.archive figure', '.team-grid article', '.statement', '.contact form', '.contact .email', '.services-link',
    '.service-banner', '.service-tagline', '.service-detail > div > p:not(.section-label):not(.service-tagline)',
    '.service-detail li', '.service-detail .button', '.service-closing > *:not(.section-label):not(h2)',
    '.work-synopsis > div > p', '.work-synopsis .project-link', '.inc-gallery figure',
    '.archive-page-grid figure', '.battle-intro p:not(.section-label)', '.battle-cards article',
    '.battle-gallery-grid figure', '.timeline-heading > p:last-child', '.timeline-item',
    '.battle-cta > *:not(.section-label):not(h2)', '.work-next a'
  ].join(','));
  targets.forEach(el => {
    el.classList.add('reveal');
    const siblings = [...el.parentElement.children].filter(s => s.matches('article, figure, li, .work-next a'));
    const idx = siblings.indexOf(el);
    if (idx > 0) el.style.setProperty('--delay', `${Math.min(idx, 6) * 110}ms`);
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  targets.forEach(el => io.observe(el));

  // Emblema del hero: imán, inclinación 3D, brillo y giro al hacer clic
  const fig = document.querySelector('.hero-emblem');
  const emblem = fig && fig.querySelector('img');
  if (emblem && matchMedia('(pointer: fine)').matches) {
    const glare = document.createElement('span');
    glare.className = 'emblem-glare';
    glare.setAttribute('aria-hidden', 'true');
    fig.append(glare);
    const cur = { tx: 0, ty: 0, rx: 0, ry: 0, s: 1 }, goal = { ...cur };
    let frame = 0;
    const tick = () => {
      let moving = false;
      for (const k in cur) {
        cur[k] += (goal[k] - cur[k]) * .12;
        if (Math.abs(goal[k] - cur[k]) > .001) moving = true;
      }
      emblem.style.setProperty('--tx', `${cur.tx}px`);
      emblem.style.setProperty('--ty', `${cur.ty}px`);
      emblem.style.setProperty('--rx', `${cur.rx}deg`);
      emblem.style.setProperty('--ry', `${cur.ry}deg`);
      emblem.style.setProperty('--s', cur.s);
      frame = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!frame) frame = requestAnimationFrame(tick); };
    addEventListener('pointermove', e => {
      const r = fig.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const reach = r.width * .9;
      const near = Math.hypot(dx, dy) < reach;
      if (near) {
        // Cerca del logo: se acerca al cursor y se inclina hacia él
        goal.tx = dx * .22; goal.ty = dy * .22;
        goal.ry = dx / r.width * 50; goal.rx = -dy / r.height * 44;
        goal.s = 1.08;
        fig.style.setProperty('--gx', `${(e.clientX - r.left) / r.width * 100}%`);
        fig.style.setProperty('--gy', `${(e.clientY - r.top) / r.height * 100}%`);
      } else {
        // Lejos: sigue suavemente el cursor por la pantalla
        const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
        goal.tx = x * 30; goal.ty = y * 30; goal.ry = x * 16; goal.rx = -y * 14; goal.s = 1;
      }
      fig.classList.toggle('is-near', near);
      kick();
    }, { passive: true });
    document.addEventListener('pointerleave', () => {
      Object.assign(goal, { tx: 0, ty: 0, rx: 0, ry: 0, s: 1 });
      fig.classList.remove('is-near');
      kick();
    });
    let turns = 0;
    fig.addEventListener('click', () => {
      fig.style.setProperty('--spin', `${++turns * 360}deg`);
      const ring = document.createElement('span');
      ring.className = 'emblem-ring';
      ring.setAttribute('aria-hidden', 'true');
      fig.append(ring);
      ring.addEventListener('animationend', () => ring.remove());
    });
  }
})();
