import { useEffect, useRef } from 'react';

export default function SpaceCloud() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const mouse = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext('2d')!;
    const resize = () => { cvs.width = innerWidth; cvs.height = innerHeight; };
    resize();
    addEventListener('resize', resize);
    addEventListener('mousemove', (e) => { mouse.current = { x: e.clientX, y: e.clientY }; });

    const colors = ['#FFC107','#FFB020','#FF9A1F','#FFD970','#FF7A00','#FFE082'];
    const blobs = Array.from({ length: 55 }, () => ({
      x: Math.random() * cvs.width,
      y: Math.random() * cvs.height,
      r: 60 + Math.random() * 120,
      vx: (Math.random() - .5) * .25,
      vy: (Math.random() - .5) * .25,
      o: .04 + Math.random() * .11,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));

    const loop = () => {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      for (const b of blobs) {
        b.x += b.vx; b.y += b.vy;
        if (b.x < -b.r) b.x = cvs.width + b.r;
        if (b.x > cvs.width + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = cvs.height + b.r;
        if (b.y > cvs.height + b.r) b.y = -b.r;
        const dx = mouse.current.x - b.x, dy = mouse.current.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 220) { b.x -= dx * .003; b.y -= dy * .003; }
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        const hex = Math.floor(b.o * 255).toString(16).padStart(2, '0');
        g.addColorStop(0, b.c + hex);
        g.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(rafRef.current); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: .55 }} />;
}
