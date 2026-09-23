(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(pointer: fine)');
  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-trail'; 
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d'); 
  if (!ctx) return;

  let particles = [], frame = 0, last = 0;
  const enabled = () => pointer.matches && !motion.matches && !document.hidden;

  function size() {
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * scale; 
    canvas.height = innerHeight * scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function clear() { 
    cancelAnimationFrame(frame); 
    frame = 0; 
    particles.length = 0; 
    ctx.clearRect(0, 0, innerWidth, innerHeight); 
  }

  const COLOR_RED = '#d61d1d';
  const COLOR_LIGHT = '#f2eee6';

  function draw(time) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    // Filtrado in-place sin crear arrays en cada frame (reduce Garbage Collection)
    let write = 0;
    for (let i = 0; i < particles.length; i++) {
      if (time - particles[i].time < 650) {
        particles[write++] = particles[i];
      }
    }
    particles.length = write;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const life = 1 - (time - p.time) / 650;

      // Línea conectora (distancia al cuadrado evita Math.hypot / sqrt)
      if (i > 0) {
        const prev = particles[i - 1];
        const dx = prev.x - p.x;
        const dy = prev.y - p.y;
        if (dx * dx + dy * dy < 10000) {
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = COLOR_RED;
          ctx.globalAlpha = life * 0.36;
          ctx.lineWidth = 1.3 * life;
          ctx.stroke();
        }
      }

      // Punto del cursor
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.7 * life, 0, Math.PI * 2);
      ctx.fillStyle = (i % 4 === 0) ? COLOR_LIGHT : COLOR_RED;
      ctx.globalAlpha = (i % 4 === 0) ? (life * 0.6) : (life * 0.55);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    frame = particles.length ? requestAnimationFrame(draw) : 0;
  }

  document.body.appendChild(canvas); 
  size();
  addEventListener('resize', size, { passive: true });
  addEventListener('pointermove', e => {
    if (!enabled() || e.pointerType !== 'mouse') return;
    const time = performance.now(); 
    if (time - last < 12) return; 
    last = time;
    particles.push({ x: e.clientX, y: e.clientY, time }); 
    if (particles.length > 50) particles.shift();
    if (!frame) frame = requestAnimationFrame(draw);
  }, { passive: true });

  document.addEventListener('visibilitychange', clear);
  motion.addEventListener('change', clear); 
  pointer.addEventListener('change', clear);
  window.addEventListener('blur', clear);
})();

