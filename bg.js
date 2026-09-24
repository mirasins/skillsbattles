// Fondo interactivo: campo de puntos que reacciona al cursor (foco de escenario),
// ondas al hacer clic y parallax con el scroll. Respeta movimiento reducido.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer: fine)');
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-field';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  document.body.prepend(canvas);

  const RED = '214,29,29', IVORY = '242,238,230';
  const PARALLAX = .16;      // el campo se desplaza más lento que el contenido
  const REACH = 300;         // radio de influencia del cursor
  const GRAVITY = 2600;      // intensidad del pozo gravitatorio
  let W = 0, H = 0, SP = 46, cols = 0, rows = 0, dpr = 1;
  let ox, oy, glow, px, py, rowId;
  const light = { x: -9e3, y: -9e3, tx: -9e3, ty: -9e3, on: 0, ton: 0 };
  const pulses = [];
  let frame = 0;

  function size() {
    W = innerWidth; H = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    SP = W < 700 ? 40 : 46;
    cols = Math.ceil(W / SP) + 1;
    rows = Math.ceil(H / SP) + 3;
    const n = cols * rows;
    ox = new Float32Array(n); oy = new Float32Array(n); glow = new Float32Array(n);
    px = new Float32Array(n); py = new Float32Array(n);
    rowId = new Int32Array(rows).fill(-1e9);
    if (reduce.matches) draw(0);
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const animate = !reduce.matches;
    const off = animate ? -(scrollY * PARALLAX) : 0;
    const r0 = Math.floor(-off / SP) - 1;

    // Luz que sigue al cursor con retardo
    light.x += (light.tx - light.x) * .1;
    light.y += (light.ty - light.y) * .1;
    light.on += (light.ton - light.on) * .08;
    if (animate && light.on > .01) {
      const g = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, 300);
      g.addColorStop(0, `rgba(${RED},${.13 * light.on})`);
      g.addColorStop(.5, `rgba(${RED},${.04 * light.on})`);
      g.addColorStop(1, `rgba(${RED},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(light.x - 300, light.y - 300, 600, 600);
    }

    // Ondas activas
    let wp = 0;
    for (let i = 0; i < pulses.length; i++) if (t - pulses[i].t < 1700) pulses[wp++] = pulses[i];
    pulses.length = wp;

    // Posiciones y brillo de cada punto
    for (let ri = 0; ri < rows; ri++) {
      const r = r0 + ri, slot = ((r % rows) + rows) % rows;
      if (rowId[slot] !== r) {            // fila nueva al hacer scroll: estado limpio
        rowId[slot] = r;
        for (let c = 0; c < cols; c++) { const k = slot * cols + c; ox[k] = oy[k] = glow[k] = 0; }
      }
      const hy = r * SP + off + SP / 2;
      for (let c = 0; c < cols; c++) {
        const k = slot * cols + c;
        let hx = c * SP + SP / 2;
        let y = hy;
        if (animate) {                    // respiración lenta del campo
          hx += Math.sin(t * .00035 + r * .7 + c * .35) * 3;
          y += Math.cos(t * .00045 + c * .6 + r * .2) * 3;
        }
        let tx = 0, ty = 0, tg = 0;
        if (animate && light.on > .01) {  // pozo gravitatorio en el cursor
          const dx = light.x - hx, dy = light.y - y, d = Math.hypot(dx, dy);
          if (d < REACH && d > 0) {
            const fade = (1 - d / REACH) ** 1.5 * light.on;
            // caída tipo 1/d, sin cruzar el horizonte (radio mínimo 14px)
            const pull = Math.min(d - 14, GRAVITY / (d + 30)) * fade;
            const swirl = pull * .45;     // componente orbital: el campo gira alrededor
            const nx = dx / d, ny = dy / d;
            tx += nx * pull - ny * swirl; ty += ny * pull + nx * swirl;
            tg += Math.min(1, fade * 1.3);
          }
        }
        for (let i = 0; i < pulses.length; i++) {  // empuje de las ondas
          const p = pulses[i], age = t - p.t, rad = age * .5;
          const dx = hx - p.x, dy = y - p.y, d = Math.hypot(dx, dy);
          const kf = Math.max(0, 1 - Math.abs(d - rad) / 80) * (1 - age / 1700);
          if (kf > 0 && d > 0) { tx += dx / d * kf * 20; ty += dy / d * kf * 20; tg += kf; }
        }
        ox[k] += (tx - ox[k]) * .12; oy[k] += (ty - oy[k]) * .12;
        glow[k] += (Math.min(1, tg) - glow[k]) * .14;
        px[k] = hx + ox[k]; py[k] = y + oy[k];
      }
    }

    // Líneas entre puntos iluminados (constelación)
    ctx.lineWidth = .8;
    for (let ri = 0; ri < rows; ri++) {
      const r = r0 + ri, slot = ((r % rows) + rows) % rows, down = (slot + 1) % rows;
      for (let c = 0; c < cols; c++) {
        const k = slot * cols + c, g = glow[k];
        if (g < .06) continue;
        if (c + 1 < cols && glow[k + 1] > .06) line(k, k + 1, Math.min(g, glow[k + 1]));
        if (ri + 1 < rows && glow[down * cols + c] > .06) line(k, down * cols + c, Math.min(g, glow[down * cols + c]));
      }
    }

    // Puntos
    for (let k = 0; k < cols * rows; k++) {
      const g = glow[k];
      const ivory = (k * 7) % 11 === 0;
      ctx.fillStyle = `rgba(${ivory ? IVORY : RED},${(ivory ? .1 : .17) + g * .75})`;
      ctx.beginPath();
      ctx.arc(px[k], py[k], 1.15 + g * 1.7, 0, 6.2832);
      ctx.fill();
    }

    if (hole) {                           // agujero negro que sigue al cursor
      hole.style.transform = `translate(${light.tx}px,${light.ty}px) scale(${.4 + light.on * .6})`;
      hole.style.opacity = light.on;
    }

    frame = animate && !document.hidden ? requestAnimationFrame(draw) : 0;
  }

  function line(a, b, g) {
    ctx.strokeStyle = `rgba(${RED},${g * .45})`;
    ctx.beginPath(); ctx.moveTo(px[a], py[a]); ctx.lineTo(px[b], py[b]); ctx.stroke();
  }

  const start = () => { if (!frame && !reduce.matches && !document.hidden) frame = requestAnimationFrame(draw); };
  const stop = () => { cancelAnimationFrame(frame); frame = 0; };

  let hole = null;
  if (fine.matches && !reduce.matches) {
    hole = document.createElement('div');
    hole.className = 'black-hole';
    hole.setAttribute('aria-hidden', 'true');
    hole.innerHTML = '<i></i>';
    document.body.append(hole);
  }

  size();
  addEventListener('resize', size, { passive: true });
  if (fine.matches) {
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      light.tx = e.clientX; light.ty = e.clientY; light.ton = 1;
    }, { passive: true });
    document.addEventListener('pointerleave', () => { light.ton = 0; });
  }
  addEventListener('pointerdown', e => {
    if (pulses.length < 6) pulses.push({ x: e.clientX, y: e.clientY, t: performance.now() });
  }, { passive: true });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  reduce.addEventListener('change', () => { stop(); size(); start(); });
  start();
})();
