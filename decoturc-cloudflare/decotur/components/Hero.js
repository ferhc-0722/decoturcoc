'use client';
import { useEffect, useRef, useState } from 'react';
import { estiloFondo, esVideoUrl } from '../lib/estilo';

export default function Hero({ fondo }) {
  const canvasRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(false);
  const videoUrl = esVideoUrl(fondo) ? fondo.trim() : null;
  const esVideo = fondo === 'video' || !!videoUrl;
  const animado = !fondo || fondo === 'animado';

  useEffect(() => {
    if (!animado) return;
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    let w, h, t = 0, raf;
    const resize = () => { w = c.width = c.offsetWidth; h = c.height = c.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const estrella = (x, y, r, rot, color) => {
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const rad = i % 2 ? r * 0.45 : r, a = rot + (i * Math.PI) / 8;
        ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
      }
      ctx.closePath(); ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.stroke();
    };
    const frame = () => {
      t += 0.004;
      ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, w, h);
      const s = 110, off = (t * 60) % s;
      for (let y = -s; y < h + s; y += s) for (let x = -s; x < w + s; x += s) {
        const cx = x + off, cy = y + off / 2, p = 0.5 + 0.5 * Math.sin(t * 2 + (x + y) * 0.01);
        estrella(cx, cy, 42, t + x * 0.002, `rgba(168,130,63,${0.25 + 0.35 * p})`);
        estrella(cx, cy, 20, -t * 1.3, `rgba(248,243,234,${0.08 + 0.12 * p})`);
      }
      raf = requestAnimationFrame(frame);
    };
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [animado]);

  return (
    <header id="inicio" style={animado || esVideo ? {} : estiloFondo(fondo)}>
      {animado && <canvas ref={canvasRef} />}
      {esVideo && (
        <video autoPlay muted loop playsInline src={videoUrl || '/hero.mp4'} onCanPlay={() => setHasVideo(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: hasVideo ? 'block' : 'none' }} />
      )}
      <div className="velo" />
      <div className="hero-txt">
        <span className="kicker">Alfombras de diseño</span>
        <h1>DECO <span>TURCO</span></h1>
        <p>Alfombras &nbsp;|&nbsp; Living Rooms</p>
        <div className="hero-btns">
          <a className="btn solido" href="#catalogo">Ver catálogo</a>
          <a className="btn" href="#contacto">Contáctanos</a>
        </div>
      </div>
      <div className="scroll-hint" />
    </header>
  );
}
