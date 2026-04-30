'use client';
import { useEffect, useRef } from 'react';

const COUNT        = 150;
const MOUSE_RADIUS = 140;
const MOUSE_FORCE  = 8;

interface P {
  x: number; y: number;
  vx: number; vy: number;
  baseVy: number;
  r: number;       // radius
  alpha: number;
}

function make(w: number, h: number, scatter = false): P {
  return {
    x:      Math.random() * w,
    y:      scatter ? Math.random() * h : -Math.random() * 300,
    vx:     (Math.random() - 0.5) * 0.5,
    vy:     0,
    baseVy: 0.7 + Math.random() * 1.8,
    r:      1.2 + Math.random() * 2.8,
    alpha:  0.45 + Math.random() * 0.55,
  };
}

export function ParticleBackground() {
  const ref  = useRef<HTMLCanvasElement>(null);
  const mx   = useRef(-9999);
  const my   = useRef(-9999);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const pts = Array.from({ length: COUNT }, () =>
      make(canvas.width, canvas.height, true)
    );

    let id = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of pts) {
        // repulsion
        const dx = p.x - mx.current;
        const dy = p.y - my.current;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < MOUSE_RADIUS && d > 0) {
          const s = ((MOUSE_RADIUS - d) / MOUSE_RADIUS) ** 2 * MOUSE_FORCE;
          p.vx += (dx / d) * s * 0.15;
          p.vy += (dy / d) * s * 0.10;
        }

        // gravity back to base fall, damp x
        p.vy += (p.baseVy - p.vy) * 0.02;
        p.vx *= 0.97;
        p.x  += p.vx;
        p.y  += p.vy;

        // wrap
        if (p.x < -20)                  p.x = canvas.width + 10;
        if (p.x > canvas.width + 20)    p.x = -10;
        if (p.y > canvas.height + 20)   Object.assign(p, make(canvas.width, canvas.height));

        // draw — glowing dot
        ctx.save();
        ctx.globalAlpha = p.alpha;

        // outer glow
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        g.addColorStop(0,   'rgba(180, 210, 255, 0.9)');
        g.addColorStop(0.4, 'rgba(140, 190, 255, 0.5)');
        g.addColorStop(1,   'rgba(100, 160, 255, 0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // solid core
        ctx.globalAlpha = p.alpha * 1.2 > 1 ? 1 : p.alpha * 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(220, 235, 255, 1)';
        ctx.fill();

        ctx.restore();
      }

      id = requestAnimationFrame(draw);
    };

    draw();

    const onMove  = (e: MouseEvent) => { mx.current = e.clientX; my.current = e.clientY; };
    const onLeave = ()               => { mx.current = -9999;    my.current = -9999; };
    window.addEventListener('mousemove',  onMove);
    window.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize',     resize);
      window.removeEventListener('mousemove',  onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position:      'fixed',
        inset:         0,
        width:         '100vw',
        height:        '100vh',
        zIndex:        1,
        pointerEvents: 'none',
        opacity:       1,
      }}
      aria-hidden
    />
  );
}
