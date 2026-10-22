import Nav from '../components/Nav';
import Hero from '../components/Hero';
import Catalog from '../components/Catalog';
import ContactoForm from '../components/ContactoForm';
import Reveal from '../components/Reveal';
import { q } from '../lib/db';
import { getAjustes } from '../lib/ajustes';
import { estiloFondo } from '../lib/estilo';
import Footer from '../components/Footer';
import { CartProvider } from '../components/Cart';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const aj = await getAjustes();
  const productos = (await q('select id, codigo, color, precio_min, precio_max, estado, foto_url, descripcion from productos order by codigo, color')).rows
    .map((r) => ({ ...r, precio_min: Number(r.precio_min), precio_max: Number(r.precio_max) }));
  const medidas = (await q('select medida from medidas order by id')).rows.map((r) => r.medida);
  const pm = (await q('select pm.producto_id, m.medida, pm.precio from producto_medidas pm join medidas m on m.id = pm.medida_id where pm.stock > 0 order by m.id')).rows;
  const porProducto = {};
  for (const r of pm) (porProducto[r.producto_id] = porProducto[r.producto_id] || []).push({ medida: r.medida, precio: Number(r.precio) || 0 });
  for (const p of productos) p.medidas = porProducto[p.id] || [];
  const pagos = { yape_qr: aj.yape_qr, yape_numero: aj.yape_numero, plin_qr: aj.plin_qr, plin_numero: aj.plin_numero, transferencia: aj.transferencia };
  const wsp = aj.whatsapp;

  return (
    <CartProvider whatsapp={wsp}>
      <Nav whatsapp={wsp} />
      <Hero fondo={aj.fondo_inicio} />

      <section id="nosotros" style={estiloFondo(aj.fondo_nosotros)}>
        <div className="split">
          <div className="reveal">
            <span className="kicker">Quiénes somos</span>
            <h2>Tradición turca,<br />pensada para tu hogar</h2>
            <p>Deco Turco nace con una idea sencilla: que cada espacio tenga una pieza con historia y carácter. Nuestras alfombras se inspiran en la tradición turca, con motivos geométricos, medallones y texturas que combinan oro, grises y crema.</p>
            <p>Trabajamos con una amplia variedad de diseños y medidas para living rooms, dormitorios y espacios de trabajo. Te asesoramos para elegir la alfombra que mejor acompaña tu decoración.</p>
            <a className="btn oscuro" href="#catalogo" style={{ marginTop: 14 }}>Explorar colección</a>
          </div>
          <div className="reveal"><div className="marco"><img src="/nosotros.jpg" alt="Alfombra Deco Turco" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /></div></div>
        </div>
        <div className="valores">
          <div className="valor reveal"><div className="icono">✦</div><h3>Diseño</h3><p>Motivos turcos contemporáneos que se adaptan a espacios clásicos y modernos.</p></div>
          <div className="valor reveal"><div className="icono">◆</div><h3>Variedad</h3><p>Colores y medidas para cada necesidad, desde 80×150 hasta 300×400 cm.</p></div>
          <div className="valor reveal"><div className="icono">❂</div><h3>Asesoría</h3><p>Te acompañamos por WhatsApp para elegir la pieza ideal para tu espacio.</p></div>
        </div>
      </section>

      <section id="catalogo" style={estiloFondo(aj.fondo_catalogo)}>
        <div className="titulo reveal"><span className="kicker">Colección</span><h2>Nuestro catálogo</h2><div className="linea" /></div>
        <Catalog productos={productos} whatsapp={wsp} pagos={pagos} />
        <div className="medidas reveal">
          <span className="kicker">Medidas</span>
          <h3 style={{ fontSize: '2rem' }}>Tamaños disponibles</h3>
          <div className="medidas-lista">{medidas.map((m) => <span key={m}>{m} cm</span>)}</div>
        </div>
      </section>

      <section id="contacto" style={estiloFondo(aj.fondo_contacto)}>
        <div className="titulo reveal"><span className="kicker">Escríbenos</span><h2>Contáctanos</h2><div className="linea" /></div>
        <div className="contacto-grid">
          <div className="reveal">
            <ul className="datos">
              <li><span className="ic">✆</span><div><b>WhatsApp</b><a target="_blank" rel="noopener" href={`https://wa.me/${wsp}`}>+{wsp}</a></div></li>
              <li><span className="ic">✉</span><div><b>Correo</b><a href={`mailto:${aj.email}`}>{aj.email}</a></div></li>
              <li><span className="ic">⌂</span><div><b>Ubicación</b><span>{aj.direccion}</span></div></li>
              <li><span className="ic">◷</span><div><b>Horario</b><span>{aj.horario}</span></div></li>
            </ul>
          </div>
          <ContactoForm whatsapp={wsp} />
        </div>
      </section>

      <Footer aj={aj} />
      <a className="flotante" target="_blank" rel="noopener" href={`https://wa.me/${wsp}?text=${encodeURIComponent('Hola, quisiera información sobre sus alfombras.')}`}>WSP</a>
      <Reveal />
    </CartProvider>
  );
}
