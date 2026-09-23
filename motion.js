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

  const finePointer = matchMedia('(pointer: fine)').matches;

  // Títulos de subpáginas letra por letra
  document.querySelectorAll('.service-intro h1, .work-intro h1, .battle-hero h1').forEach(h1 => {
    let ci = 0;
    const split = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (!part.trim()) return frag.append(part);
            const word = document.createElement('span');
            word.className = 'w';
            [...part].forEach(c => {
              const ch = document.createElement('span');
              ch.className = 'ch';
              ch.style.setProperty('--ci', ci++);
              ch.textContent = c;
              word.append(ch);
            });
            frag.append(word);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') split(child);
      });
    };
    h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
    split(h1);
    h1.querySelectorAll('.w').forEach(w => w.setAttribute('aria-hidden', 'true'));
    if (!finePointer) return;
    // Ola: las letras cercanas al cursor se levantan
    const chars = [...h1.querySelectorAll('.ch')];
    h1.addEventListener('pointermove', e => {
      chars.forEach(ch => {
        const r = ch.getBoundingClientRect();
        const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        ch.style.setProperty('--lift', Math.max(0, 1 - d / 140).toFixed(3));
      });
    });
    h1.addEventListener('pointerleave', () => chars.forEach(ch => ch.style.setProperty('--lift', 0)));
  });

  // Imagen principal que reacciona al mouse: imán, inclinación 3D, brillo y giro al hacer clic
  const magnetic = (fig, opts = {}) => {
    const img = fig && fig.querySelector('img');
    if (!img || !finePointer) return;
    fig.classList.add('magnetic');
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
      img.style.setProperty('--tx', `${cur.tx}px`);
      img.style.setProperty('--ty', `${cur.ty}px`);
      img.style.setProperty('--rx', `${cur.rx}deg`);
      img.style.setProperty('--ry', `${cur.ry}deg`);
      img.style.setProperty('--s', cur.s);
      frame = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!frame) frame = requestAnimationFrame(tick); };
    const k = opts.strength || 1;
    addEventListener('pointermove', e => {
      const r = fig.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const near = Math.hypot(dx, dy) < r.width * .9;
      if (near) {
        // Cerca: se acerca al cursor y se inclina hacia él
        goal.tx = dx * .22 * k; goal.ty = dy * .22 * k;
        goal.ry = dx / r.width * 50 * k; goal.rx = -dy / r.height * 44 * k;
        goal.s = 1 + .08 * k;
        fig.style.setProperty('--gx', `${(e.clientX - r.left) / r.width * 100}%`);
        fig.style.setProperty('--gy', `${(e.clientY - r.top) / r.height * 100}%`);
      } else {
        // Lejos: sigue suavemente el cursor por la pantalla
        const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
        goal.tx = x * 30 * k; goal.ty = y * 30 * k; goal.ry = x * 16 * k; goal.rx = -y * 14 * k; goal.s = 1;
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
  };
  magnetic(document.querySelector('.hero-emblem'));
  magnetic(document.querySelector('.battle-mark'), { strength: .8 });

  // Inclinación 3D de fotos y tarjetas al pasar el mouse
  if (finePointer) {
    document.querySelectorAll('.battle-cards article, .inc-gallery figure, .archive-page-grid figure, .battle-gallery-grid figure, .timeline-media, .project-card').forEach(el => {
      el.classList.add('tilt');
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(900px) rotateX(${-y * 9}deg) rotateY(${x * 11}deg) translateY(-6px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  // Parallax con el scroll
  const layers = [
    ['.service-intro, .inc-hero-copy, .battle-hero-copy', y => ({ translate: `0 ${y * .28}px`, opacity: Math.max(0, 1 - y / 750) })],
    ['.inc-hero-video', y => ({ translate: `0 ${y * .35}px` })],
    ['.battle-mark', y => ({ translate: `0 ${y * -.12}px` })],
  ].flatMap(([sel, fn]) => [...document.querySelectorAll(sel)].map(el => [el, fn]));
  const banners = [...document.querySelectorAll('.service-banner img')];
  if (layers.length || banners.length) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = scrollY;
      if (y < innerHeight * 1.5) layers.forEach(([el, fn]) => Object.assign(el.style, fn(y)));
      banners.forEach(img => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const offset = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        img.style.translate = `0 ${offset * -r.height * .08}px`;
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }
})();
