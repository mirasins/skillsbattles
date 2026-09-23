(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(pointer: fine)');
  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-trail'; canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  let particles = [], frame = 0, last = 0;
  const enabled = () => pointer.matches && !motion.matches && !document.hidden;
  function size() {
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * scale; canvas.height = innerHeight * scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }
  function clear() { cancelAnimationFrame(frame); frame = 0; particles = []; ctx.clearRect(0,0,innerWidth,innerHeight); }
  function draw(time) {
    ctx.clearRect(0,0,innerWidth,innerHeight);
    particles = particles.filter(p => time - p.time < 650);
    particles.forEach((p,i) => {
      const life = 1 - (time - p.time) / 650;
      const prev = particles[i-1];
      if(prev && Math.hypot(prev.x-p.x,prev.y-p.y)<100){
        ctx.beginPath(); ctx.moveTo(prev.x,prev.y); ctx.lineTo(p.x,p.y);
        ctx.strokeStyle = `rgba(214,29,29,${life*.36})`; ctx.lineWidth=1.3*life; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(p.x,p.y,1.7*life,0,Math.PI*2);
      ctx.fillStyle = i%4===0 ? `rgba(242,238,230,${life*.6})` : `rgba(214,29,29,${life*.55})`; ctx.fill();
    });
    frame = particles.length ? requestAnimationFrame(draw) : 0;
  }
  document.body.appendChild(canvas); size();
  addEventListener('resize', size, {passive:true});
  addEventListener('pointermove', e => {
    if(!enabled() || e.pointerType !== 'mouse') return;
    const time = performance.now(); if(time-last<12) return; last=time;
    particles.push({x:e.clientX,y:e.clientY,time}); if(particles.length>50) particles.shift();
    if(!frame) frame=requestAnimationFrame(draw);
  }, {passive:true});
  document.addEventListener('visibilitychange',clear);
  motion.addEventListener('change',clear); pointer.addEventListener('change',clear);
  window.addEventListener('blur',clear);
})();
