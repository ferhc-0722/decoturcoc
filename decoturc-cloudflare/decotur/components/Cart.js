'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { crearPedido } from '../app/tienda-actions';

const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx) || { items: [], count: 0, add() {}, abrir() {} };

const fmt = (n) => Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const VACIO = { nombre: '', email: '', telefono: '', documento: '', direccion: '', ciudad: '', notas: '' };

function cargarCulqi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('sin ventana'));
  if (window.CulqiCheckout) return Promise.resolve();
  return new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = 'https://js.culqi.com/checkout-js';
    s.async = true;
    s.onload = () => (window.CulqiCheckout ? ok() : fail(new Error('Culqi no cargó')));
    s.onerror = () => fail(new Error('No se pudo cargar Culqi'));
    document.body.appendChild(s);
  });
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState('carrito'); // carrito | datos | ok
  const [form, setForm] = useState(VACIO);
  const [acepto, setAcepto] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [pedidoOk, setPedidoOk] = useState(null);

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem('dt_cart') || '[]'); if (Array.isArray(s)) setItems(s); } catch (e) {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('dt_cart', JSON.stringify(items)); } catch (e) {}
  }, [items]);

  const add = useCallback((it) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.producto_id === it.producto_id && x.medida === it.medida);
      if (i >= 0) { const c = [...prev]; c[i] = { ...c[i], qty: Math.min(20, c[i].qty + 1) }; return c; }
      return [...prev, { ...it, qty: 1 }];
    });
  }, []);
  const abrir = useCallback(() => { setPaso('carrito'); setError(''); setAbierto(true); }, []);
  const cerrar = () => { if (!cargando) setAbierto(false); };
  const cambiar = (i, d) => setItems((p) => p.map((x, k) => (k === i ? { ...x, qty: Math.max(1, Math.min(20, x.qty + d)) } : x)).filter(Boolean));
  const quitar = (i) => setItems((p) => p.filter((_, k) => k !== i));
  const total = items.reduce((s, x) => s + x.precio * x.qty, 0);
  const count = items.reduce((s, x) => s + x.qty, 0);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e) => e.key === 'Escape' && !cargando && setAbierto(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [abierto, cargando]);

  async function cobrar(pedidoId, token) {
    setCargando(true);
    try {
      const r = await fetch('/api/culqi/cargo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pedidoId, token }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) {
        setItems([]); setPedidoOk(pedidoId); setPaso('ok');
      } else {
        setError(d.error || 'El pago fue rechazado. Revisa los datos de tu tarjeta e inténtalo de nuevo.');
      }
    } catch (e) {
      setError('No pudimos confirmar el pago. Si te cobraron, escríbenos por WhatsApp con tu correo.');
    }
    setCargando(false);
  }

  async function pagar(e) {
    e.preventDefault();
    setError('');
    if (!acepto) { setError('Debes aceptar los Términos y condiciones y la Política de cambios y devoluciones.'); return; }
    const pk = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY;
    if (!pk) { setError('El pago con tarjeta aún no está configurado.'); return; }
    setCargando(true);
    const r = await crearPedido(form, items.map((i) => ({ producto_id: i.producto_id, medida: i.medida, qty: i.qty })));
    if (!r.ok) { setError(r.error); setCargando(false); return; }
    try {
      await cargarCulqi();
      const [firstName, ...resto] = r.nombre.split(' ');
      const color = '#A8823F';
      const culqi = new window.CulqiCheckout(pk, {
        settings: { title: 'Deco Turco', currency: 'PEN', amount: r.centavos },
        client: { email: r.email, firstName, lastName: resto.join(' ') || firstName },
        options: {
          lang: 'es', installments: false, modal: true,
          paymentMethods: { tarjeta: true, yape: true, billetera: false, bancaMovil: false, agente: false, cuotealo: false },
        },
        appearance: {
          theme: 'default', hiddenCulqiLogo: false, hiddenBannerContent: false, hiddenBanner: false, hiddenToolBarAmount: false,
          menuType: 'sidebar', buttonCardPayText: 'Pagar', logo: '',
          defaultStyle: { bannerColor: color, buttonBackground: color, menuColor: color, linksColor: color, buttonTextColor: '#FFFFFF', priceColor: color },
        },
      });
      culqi.culqi = () => {
        if (culqi.token) {
          const id = culqi.token.id;
          culqi.close();
          cobrar(r.id, id);
        } else {
          setError((culqi.error && (culqi.error.user_message || culqi.error.merchant_message)) || 'No se pudo procesar el pago.');
          setCargando(false);
        }
      };
      culqi.open();
      // si el cliente cierra la ventana de Culqi sin pagar, vuelve a habilitar el botón
      setTimeout(() => setCargando(false), 800);
    } catch (err) {
      setError('No pudimos abrir la pasarela de pago. Revisa tu conexión e inténtalo otra vez.');
      setCargando(false);
    }
  }

  const ctx = useMemo(() => ({ items, count, add, abrir }), [items, count, add, abrir]);

  return (
    <CartCtx.Provider value={ctx}>
      {children}
      {abierto && (
        <div className="cart-overlay" onClick={cerrar}>
          <aside className="cart" role="dialog" aria-modal="true" aria-label="Carrito de compras" onClick={(e) => e.stopPropagation()}>
            <div className="cart-head">
              <h3>{paso === 'ok' ? 'Pedido recibido' : paso === 'datos' ? 'Tus datos' : 'Tu carrito'}</h3>
              <button type="button" className="modal-x" style={{ position: 'static' }} onClick={cerrar} aria-label="Cerrar">×</button>
            </div>

            {paso === 'ok' && (
              <div className="cart-body">
                <p className="ok-msg">¡Gracias por tu compra!</p>
                <p>Tu pago fue aprobado. Tu número de pedido es <b>#{pedidoOk}</b>. Te contactaremos para coordinar la entrega.</p>
                <button type="button" className="btn solido" onClick={() => setAbierto(false)}>Seguir comprando</button>
              </div>
            )}

            {paso === 'carrito' && (
              <>
                <div className="cart-body">
                  {items.length === 0 && <p className="cart-vacio">Tu carrito está vacío.</p>}
                  {items.map((x, i) => (
                    <div className="cart-item" key={`${x.producto_id}-${x.medida}`}>
                      <div className="cart-foto">{x.foto ? <img src={x.foto} alt="" /> : x.codigo}</div>
                      <div className="cart-info">
                        <b>{x.codigo}</b> <span>{x.color}</span>
                        <small>{x.medida} cm · S/ {fmt(x.precio)}</small>
                        <div className="cart-qty">
                          <button type="button" onClick={() => cambiar(i, -1)} aria-label="Menos">−</button>
                          <span>{x.qty}</span>
                          <button type="button" onClick={() => cambiar(i, 1)} aria-label="Más">+</button>
                          <button type="button" className="cart-del" onClick={() => quitar(i)}>Quitar</button>
                        </div>
                      </div>
                      <div className="cart-sub">S/ {fmt(x.precio * x.qty)}</div>
                    </div>
                  ))}
                </div>
                {items.length > 0 && (
                  <div className="cart-foot">
                    <div className="cart-total"><span>Total</span><b>S/ {fmt(total)}</b></div>
                    <button type="button" className="btn solido" onClick={() => setPaso('datos')}>Continuar con la compra</button>
                  </div>
                )}
              </>
            )}

            {paso === 'datos' && (
              <form onSubmit={pagar} className="cart-form">
                <div className="cart-body">
                  <label>Nombre completo *<input required value={form.nombre} onChange={set('nombre')} autoComplete="name" /></label>
                  <label>Correo *<input required type="email" value={form.email} onChange={set('email')} autoComplete="email" /></label>
                  <label>Teléfono / WhatsApp *<input required value={form.telefono} onChange={set('telefono')} autoComplete="tel" /></label>
                  <label>DNI / CE<input value={form.documento} onChange={set('documento')} /></label>
                  <label>Dirección de entrega *<input required value={form.direccion} onChange={set('direccion')} autoComplete="street-address" /></label>
                  <label>Distrito / Ciudad *<input required value={form.ciudad} onChange={set('ciudad')} /></label>
                  <label>Notas (opcional)<textarea rows={2} value={form.notas} onChange={set('notas')} /></label>
                  <label className="cart-check">
                    <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />
                    <span>Acepto los <a href="/terminos" target="_blank" rel="noopener">Términos y condiciones</a> y la <a href="/devoluciones" target="_blank" rel="noopener">Política de cambios y devoluciones</a>.</span>
                  </label>
                  {error && <p className="cart-error" role="alert">{error}</p>}
                </div>
                <div className="cart-foot">
                  <div className="cart-total"><span>Total a pagar</span><b>S/ {fmt(total)}</b></div>
                  <button className="btn solido" disabled={cargando}>{cargando ? 'Procesando…' : 'Pagar con tarjeta o Yape'}</button>
                  <button type="button" className="cart-back" onClick={() => { setPaso('carrito'); setError(''); }} disabled={cargando}>← Volver al carrito</button>
                  <p className="nota">Pago seguro procesado por Culqi. No guardamos los datos de tu tarjeta.</p>
                </div>
              </form>
            )}
          </aside>
        </div>
      )}
    </CartCtx.Provider>
  );
}
