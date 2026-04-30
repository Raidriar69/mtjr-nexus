'use client';
import { useEffect, useRef } from 'react';

// ── Tuning ────────────────────────────────────────────────────────────────────
const COUNT        = 160;   // total particles
const MOUSE_RADIUS = 130;   // px — how close mouse needs to be to deflect
const MOUSE_FORCE  = 6;     // deflection strength
const RETURN_SPEED = 0.018; // how fast particles drift back to natural fall

// ── Types ─────────────────────────────────────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVy: number;  // natural fall speed
  size: number;
  opacity: number;
}

function spawn(w: number, h: number, anywhere = false): Particle {
  return {
    x:       Math.random() * w,
    y:       anywhere ? Math.random() * h : -(Math.random() * 200),
    vx:      (Math.random() - 0.5) * 0.4,
    vy:      0,
    baseVy:  0.6 + Math.random() * 1.6,
    size:    0.8 + Math.random() * 2.2,
    opacity: 0.25 + Math.random() * 0.55,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse     = useRef({ x: -9999, y: -9999 });
  const ptcls     = useRef<Particle[]>([]);
  const raf       = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Sizing ────────────────────────────────────────────────────────────────
    function resize() {
      canvas!.width  = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // ── Seed particles spread across screen on first load ─────────────────────
    ptcls.current = Array.from({ length: COUNT }, () =>
      spawn(canvas.width, canvas.height, true)
    );

    // ── Main loop ─────────────────────────────────────────────────────────────
    function tick() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      const mx = mouse.current.x;
      const my = mouse.current.y;

      for (const p of ptcls.current) {
        // Mouse repulsion — acts like wind / a barrier
        const dx   = p.x - mx;
        const dy   = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_RADIUS && dist > 0) {
          const strength = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) ** 2;
          p.vx += (dx / dist) * strength * MOUSE_FORCE * 0.12;
          p.vy += (dy / dist) * strength * MOUSE_FORCE * 0.08;
        }

        // Gradually pull vy back toward natural fall speed
        p.vy += (p.baseVy - p.vy) * RETURN_SPEED;
        // Gradually dampen horizontal drift
        p.vx *= 0.97;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap horizontally
        if (p.x < -20)                 p.x = canvas!.width  + 10;
        if (p.x > canvas!.width  + 20) p.x = -10;

        // Reset to top when falling off bottom
        if (p.y > canvas!.height + 20) {
          Object.assign(p, spawn(canvas!.width, canvas!.height, false));
        }

        // Draw — soft glowing dot
        const g = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
        g.addColorStop(0,   `rgba(200, 220, 255, ${p.opacity})`);
        g.addColorStop(0.5, `rgba(160, 200, 255, ${p.opacity * 0.6})`);
        g.addColorStop(1,   `rgba(120, 180, 255, 0)`);

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx!.fillStyle = g;
        ctx!.fill();

        // Solid bright core
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(230, 240, 255, ${p.opacity})`;
        ctx!.fill();
      }

      raf.current = requestAnimationFrame(tick);
    }

    tick();

    // ── Mouse tracking ────────────────────────────────────────────────────────
    const onMove  = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    const onLeave = ()               => { mouse.current = { x: -9999,    y: -9999    }; };
    window.addEventListener('mousemove',   onMove);
    window.addEventListener('mouseleave',  onLeave);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize',     resize);
      window.removeEventListener('mousemove',  onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.75 }}
      aria-hidden="true"
    />
  );
}
