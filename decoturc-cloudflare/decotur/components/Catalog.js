'use client';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from './Cart';

const CLAVES = {
  cream: ['cream', 'crema'], beige: ['beige'], grey: ['grey', 'gris', 'antrasit', 'black'],
  blue: ['blue', 'navy'], gold: ['gold', 'yellow', 'mustard', 'vizon'], white: ['white'],
};
const FILTROS = [['todos', 'Todos'], ['cream', 'Cream'], ['beige', 'Beige'], ['grey', 'Grey'], ['blue', 'Blue'], ['gold', 'Gold / Yellow'], ['white', 'White']];

const fmt = (n) => Number(n).toLocaleString('es-PE', { maximumFractionDigits: 0 });
const coincide = (p, filtro) => filtro === 'todos' || (CLAVES[filtro] || []).some((k) => p.color.toLowerCase().includes(k));
const tituloColor = (c) => c.toLowerCase().replace(/(^|[\s/.])([a-z])/g, (m, a, b) => a + b.toUpperCase());

export default function Catalog({ productos, whatsapp, pagos = {} }) {
  const [filtro, setFiltro] = useState('todos');
  const [abierto, setAbierto] = useState(null); // { codigo, id }

  // Agrupa por código (orden ascendente) y, dentro de cada código, por color
  const grupos = useMemo(() => {
    const m = new Map();
    for (const p of productos) {
      if (!m.has(p.codigo)) m.set(p.codigo, []);
      m.get(p.codigo).push(p);
    }
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'es', { numeric: true }))
      .map(([codigo, vars]) => ({
        codigo,
        variantes: vars.sort((a, b) => a.color.localeCompare(b.color, 'es')),
      }));
  }, [productos]);

  const visibles = grupos
    .map((g) => ({ ...g, variantes: g.variantes.filter((v) => coincide(v, filtro)) }))
    .filter((g) => g.variantes.length > 0);

  const grupoAbierto = abierto && grupos.find((g) => g.codigo === abierto.codigo);

  return (
    <>
      <div className="filtros">
        {FILTROS.map(([k, label]) => (
          <button key={k} className={filtro === k ? 'activo' : ''} onClick={() => setFiltro(k)}>{label}</button>
        ))}
      </div>
      <div className="grid">
        {visibles.map((g) => (
          <Tarjeta key={g.codigo} grupo={g} onAbrir={(id) => setAbierto({ codigo: g.codigo, id })} />
        ))}
      </div>
      {visibles.length === 0 && <p className="vacio" style={{ display: 'block' }}>No hay alfombras en esta categoría por ahora.</p>}

      {grupoAbierto && (
        <Detalle
          grupo={grupoAbierto}
          inicial={abierto.id}
          whatsapp={whatsapp}
          pagos={pagos}
          onCerrar={() => setAbierto(null)}
        />
      )}
    </>
  );
}

function Tarjeta({ grupo, onAbrir }) {
  const [sel, setSel] = useState(grupo.variantes[0].id);
  const v = grupo.variantes.find((x) => x.id === sel) || grupo.variantes[0];
  const agotado = v.estado === 'agotado';
  return (
    <article className={`pc ${agotado ? 'agotado' : ''}`}>
      <button type="button" className="foto pc-foto" onClick={() => onAbrir(v.id)} aria-label={`Ver alfombra ${grupo.codigo} ${v.color}`}>
        {v.foto_url ? <img src={v.foto_url} alt={`Alfombra ${grupo.codigo} ${v.color}`} loading="lazy" /> : grupo.codigo}
      </button>
      <div className="info">
        <div className="codigo">{grupo.codigo}</div>
        <div className="color">{tituloColor(v.color)}</div>
        {grupo.variantes.length > 1 && (
          <div className="chips" role="group" aria-label="Colores">
            {grupo.variantes.map((x) => (
              <button
                type="button"
                key={x.id}
                className={`chip ${x.id === v.id ? 'on' : ''} ${x.estado === 'agotado' ? 'off' : ''}`}
                onClick={() => setSel(x.id)}
              >{tituloColor(x.color)}</button>
            ))}
          </div>
        )}
        {agotado ? (
          <div className="badge">Producto agotado</div>
        ) : (
          <div className="precio">S/ {fmt(v.precio_min)} – S/ {fmt(v.precio_max)}</div>
        )}
        <button type="button" className="wsp pc-btn" onClick={() => onAbrir(v.id)}>Ver medidas y pagar</button>
      </div>
    </article>
  );
}

function Detalle({ grupo, inicial, whatsapp, pagos, onCerrar }) {
  const [id, setId] = useState(inicial);
  const [medida, setMedida] = useState(null);
  const v = grupo.variantes.find((x) => x.id === id) || grupo.variantes[0];
  const agotado = v.estado === 'agotado';
  const sel = v.medidas.find((m) => m.medida === medida);
  const { add, abrir } = useCart();
  const agregar = () => {
    if (!sel || !(sel.precio > 0)) return;
    add({ producto_id: v.id, codigo: grupo.codigo, color: v.color, medida: sel.medida, precio: sel.precio, foto: v.foto_url || '' });
    onCerrar();
    abrir();
  };
  const descripcion = v.descripcion || `Alfombra de diseño turco ${grupo.codigo} en tonos ${tituloColor(v.color)}. Ideal para living rooms, dormitorios y espacios de trabajo.`;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onCerrar]);

  const msg = encodeURIComponent(
    `Hola, me interesa la alfombra ${grupo.codigo} ${v.color}` +
    (sel ? `, medida ${sel.medida} cm${sel.precio > 0 ? ` (S/ ${fmt(sel.precio)})` : ''}` : '') +
    '. ¿Me confirmas disponibilidad y cómo pagar?'
  );
  const hayPagos = pagos.yape_qr || pagos.yape_numero || pagos.plin_numero || pagos.plin_qr || pagos.transferencia;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={`Alfombra ${grupo.codigo}`} onClick={onCerrar}>
      <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-x" onClick={onCerrar} aria-label="Cerrar">×</button>

        <div className="modal-foto foto">
          {v.foto_url ? <img src={v.foto_url} alt={`Alfombra ${grupo.codigo} ${v.color}`} /> : grupo.codigo}
        </div>

        <div className="modal-cuerpo">
          <div className="codigo">{grupo.codigo}</div>
          <h3>{tituloColor(v.color)}</h3>

          {grupo.variantes.length > 1 && (
            <div className="chips">
              {grupo.variantes.map((x) => (
                <button type="button" key={x.id}
                  className={`chip ${x.id === v.id ? 'on' : ''} ${x.estado === 'agotado' ? 'off' : ''}`}
                  onClick={() => { setId(x.id); setMedida(null); }}>{tituloColor(x.color)}</button>
              ))}
            </div>
          )}

          <p className="desc">{descripcion}</p>

          {agotado ? (
            <div className="badge" style={{ marginTop: 18 }}>Producto agotado</div>
          ) : (
            <>
              <h4>Elige la medida</h4>
              <div className="medidas-sel">
                {v.medidas.map((m) => (
                  <button type="button" key={m.medida} className={`med ${medida === m.medida ? 'on' : ''}`} onClick={() => setMedida(m.medida)}>
                    <span>{m.medida} cm</span>
                    <small>{m.precio > 0 ? `S/ ${fmt(m.precio)}` : 'Consultar'}</small>
                  </button>
                ))}
              </div>
              <div className="precio" style={{ marginTop: 14 }}>
                {sel && sel.precio > 0 ? `S/ ${fmt(sel.precio)}` : `Desde S/ ${fmt(v.precio_min)} hasta S/ ${fmt(v.precio_max)}`}
              </div>

              {hayPagos && (
                <div className="pagos">
                  <h4>Métodos de pago</h4>
                  <div className="pagos-grid">
                    {(pagos.yape_qr || pagos.yape_numero) && (
                      <div className="pago">
                        <b>Yape</b>
                        {pagos.yape_qr && <img src={pagos.yape_qr} alt="QR de Yape" />}
                        {pagos.yape_numero && <span>{pagos.yape_numero}</span>}
                      </div>
                    )}
                    {(pagos.plin_numero || pagos.plin_qr) && (
                      <div className="pago">
                        <b>Plin</b>
                        {pagos.plin_qr && <img src={pagos.plin_qr} alt="QR de Plin" />}
                        {pagos.plin_numero && <span>{pagos.plin_numero}</span>}
                      </div>
                    )}
                    {pagos.transferencia && (
                      <div className="pago ancho">
                        <b>Transferencia</b>
                        <span style={{ whiteSpace: 'pre-line' }}>{pagos.transferencia}</span>
                      </div>
                    )}
                  </div>
                  <p className="nota">Después de pagar, envíanos la captura por WhatsApp para confirmar tu pedido.</p>
                </div>
              )}

              {sel && sel.precio > 0 ? (
                <button type="button" className="btn solido pc-wsp" onClick={agregar}>Agregar al carrito · S/ {fmt(sel.precio)}</button>
              ) : (
                <button type="button" className="btn solido pc-wsp" disabled>{sel ? 'Esta medida no tiene precio en línea' : 'Elige una medida para comprar'}</button>
              )}
              <a className="wsp pc-btn" style={{ marginTop: 10 }} target="_blank" rel="noopener" href={`https://wa.me/${whatsapp}?text=${msg}`}>
                {sel ? `Consultar ${sel.medida} cm por WhatsApp` : 'Consultar por WhatsApp'}
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
