'use client';
import { useEffect, useState } from 'react';
import { useCart } from './Cart';

const LINKS = [['inicio', 'Inicio'], ['nosotros', 'Nosotros'], ['catalogo', 'Catálogo'], ['contacto', 'Contáctanos']];

export default function Nav({ whatsapp }) {
  const [scrolled, setScrolled] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState('inicio');
  const { count, abrir } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setActivo(en.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    LINKS.forEach(([id]) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => { window.removeEventListener('scroll', onScroll); obs.disconnect(); };
  }, []);

  const wsp = `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola, quisiera información sobre sus alfombras.')}`;
  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <a className="logo" href="#inicio"><img src="/logo.png" alt="Deco Turco" /></a>
      <button className="menu-btn" aria-label="Menú" onClick={() => setAbierto(!abierto)}>☰</button>
      <ul className={`links ${abierto ? 'abierto' : ''}`}>
        {LINKS.map(([id, label]) => (
          <li key={id}><a href={`#${id}`} className={activo === id ? 'on' : ''} onClick={() => setAbierto(false)}>{label}</a></li>
        ))}
        <li><button type="button" className="nav-cart" onClick={() => { setAbierto(false); abrir(); }}>Carrito{count > 0 ? ` (${count})` : ''}</button></li>
        <li><a className="nav-wsp" target="_blank" rel="noopener" href={wsp}>WhatsApp</a></li>
      </ul>
    </nav>
  );
}
