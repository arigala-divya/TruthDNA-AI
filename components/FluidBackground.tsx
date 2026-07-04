"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
}

/** Full-screen fluid flow-field. Particles ride a time-varying curl field,
 *  bend around the pointer, and tilt with device motion sensors on mobile. */
export default function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let raf = 0;
    const pointer = { x: -9999, y: -9999, active: false };
    const tilt = { x: 0, y: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const COUNT = reduced ? 0 : Math.min(320, Math.floor((width * height) / 6500));
    const particles: Particle[] = [];
    const spawn = (p?: Particle): Particle => {
      const particle = p ?? ({} as Particle);
      particle.x = Math.random() * width;
      particle.y = Math.random() * height;
      particle.vx = 0;
      particle.vy = 0;
      particle.maxLife = 200 + Math.random() * 400;
      particle.life = Math.random() * particle.maxLife;
      // blues → violets, matching the brand gradient
      particle.hue = 205 + Math.random() * 55;
      return particle;
    };
    for (let i = 0; i < COUNT; i++) particles.push(spawn());

    // Cheap pseudo-curl-noise: layered sines make a divergence-light flow field.
    const field = (x: number, y: number, t: number) => {
      const s = 0.0016;
      const a =
        Math.sin(x * s + t * 0.32) * Math.cos(y * s * 1.3 - t * 0.21) +
        Math.sin((x + y) * s * 0.6 + t * 0.13);
      return a * Math.PI;
    };

    let t = 0;
    const step = () => {
      t += 0.008;
      // translucent fill = motion trails ("fluid" look)
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(13, 13, 13, 0.085)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (const p of particles) {
        const angle = field(p.x, p.y, t);
        p.vx += Math.cos(angle) * 0.06 + tilt.x * 0.02;
        p.vy += Math.sin(angle) * 0.06 + tilt.y * 0.02;

        // pointer vortex: swirl around the cursor instead of just repelling
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 40000 && d2 > 1) {
            const d = Math.sqrt(d2);
            const force = (200 - d) / 200;
            p.vx += ((-dy / d) * 0.9 + (dx / d) * 0.25) * force;
            p.vy += ((dx / d) * 0.9 + (dy / d) * 0.25) * force;
          }
        }

        p.vx *= 0.94;
        p.vy *= 0.94;
        const px = p.x;
        const py = p.y;
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.life > p.maxLife || p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) {
          spawn(p);
          continue;
        }

        const fade = Math.sin((p.life / p.maxLife) * Math.PI);
        const speed = Math.min(1, Math.hypot(p.vx, p.vy) / 3);
        ctx.strokeStyle = `hsla(${p.hue}, 85%, ${55 + speed * 20}%, ${0.05 + fade * 0.16})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      raf = requestAnimationFrame(step);
    };
    if (!reduced) raf = requestAnimationFrame(step);

    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };
    // motion sensors: device tilt steers the flow on phones/tablets
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      tilt.x = Math.max(-1, Math.min(1, e.gamma / 45));
      tilt.y = Math.max(-1, Math.min(1, (e.beta - 45) / 45));
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("deviceorientation", onOrientation);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
