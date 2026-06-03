import { useEffect, useRef } from 'react';

/**
 * Low-cost ambient gold blobs background.
 * - Density scales with screen size (fewer blobs on mobile)
 * - Pauses when tab is hidden (saves CPU/battery)
 * - Respects "prefers-reduced-motion" → static fallback
 * - Caps DPR at 1.5 for sharp but cheap rendering
 */
export default function SpaceCloud() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const mouse = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext('2d', { alpha: true })!;

    // Respect user motion preference — render once then stop
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      const w = innerWidth, h = innerHeight;
      cvs.width = Math.floor(w * dpr);
      cvs.height = Math.floor(h * dpr);
      cvs.style.width = w + 'px';
      cvs.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener('resize', resize, { passive: true });

    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    addEventListener('mousemove', onMove, { passive: true });

    // Far fewer blobs on smaller screens
    const w = innerWidth;
    const count = w < 640 ? 18 : w < 1024 ? 28 : 38;

    const colors = ['#FFC107','#FFB020','#FF9A1F','#FFD970','#FF7A00','#FFE082'];
    const blobs = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * innerHeight,
      r: 60 + Math.random() * 110,
      vx: (Math.random() - .5) * .22,
      vy: (Math.random() - .5) * .22,
      o: .04 + Math.random() * .10,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));

    const draw = () => {
      const W = innerWidth, H = innerHeight;
      ctx.clearRect(0, 0, W, H);
      for (const b of blobs) {
        b.x += b.vx; b.y += b.vy;
        if (b.x < -b.r) b.x = W + b.r;
        if (b.x > W + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = H + b.r;
        if (b.y > H + b.r) b.y = -b.r;
        // Cheap mouse interaction (no sqrt — distance squared comparison)
        const dx = mouse.current.x - b.x, dy = mouse.current.y - b.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < 48400) { b.x -= dx * .003; b.y -= dy * .003; }
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        const hex = Math.floor(b.o * 255).toString(16).padStart(2, '0');
        g.addColorStop(0, b.c + hex);
        g.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
    };

    let running = !reduceMotion;
    const loop = () => { if (!running) return; draw(); rafRef.current = requestAnimationFrame(loop); };

    if (reduceMotion) {
      draw();
    } else {
      loop();
    }

    // Pause when tab hidden — huge battery + CPU savings
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        running = false;
        cancelAnimationFrame(rafRef.current);
      } else if (!reduceMotion && !running) {
        running = true;
        loop();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      removeEventListener('resize', resize);
      removeEventListener('mousemove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: .5 }} />;
}
