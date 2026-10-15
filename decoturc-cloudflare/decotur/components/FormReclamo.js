'use client';
import { useState } from 'react';
import { crearReclamo } from '../app/tienda-actions';

const INIT = {
  nombre: '', documento_tipo: 'DNI', documento_num: '', domicilio: '', telefono: '', email: '',
  menor: false, apoderado: '', tipo_bien: 'producto', monto: '', descripcion_bien: '',
  tipo: 'reclamo', detalle: '', pedido_consumidor: '',
};

export default function FormReclamo({ proveedor }) {
  const [f, setF] = useState(INIT);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [hoja, setHoja] = useState(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    setError(''); setCargando(true);
    const r = await crearReclamo(f);
    setCargando(false);
    if (!r.ok) { setError(r.error); return; }
    setHoja(r);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (hoja) {
    const d = hoja.datos;
    const fecha = new Date(hoja.fecha).toLocaleString('es-PE', { timeZone: 'America/Lima' });
    return (
      <div className="hoja">
        <div className="hoja-aviso no-print">
          <b>Tu hoja de reclamación fue registrada.</b> Guarda o imprime esta hoja como constancia. Responderemos en un plazo máximo de 30 días calendario al correo <b>{d.email}</b>.
        </div>
        <h2>Hoja de Reclamación N° {hoja.codigo}</h2>
        <p className="hoja-fecha">Fecha y hora: {fecha}</p>
        <h3>1. Identificación del consumidor reclamante</h3>
        <p>Nombre: {d.nombre}<br />{d.documento_tipo}: {d.documento_num}<br />Domicilio: {d.domicilio}<br />Teléfono: {d.telefono || '—'} · Correo: {d.email}{d.menor && <><br />Padre/madre/apoderado: {d.apoderado}</>}</p>
        <h3>2. Identificación del bien contratado</h3>
        <p>{d.tipo_bien === 'servicio' ? 'Servicio' : 'Producto'}: {d.descripcion_bien || '—'}<br />Monto reclamado: {d.monto ? `S/ ${Number(d.monto).toFixed(2)}` : '—'}</p>
        <h3>3. Detalle de la reclamación y pedido del consumidor</h3>
        <p><b>{d.tipo === 'queja' ? 'QUEJA' : 'RECLAMO'}</b><br />Detalle: {d.detalle}<br />Pedido del consumidor: {d.pedido_consumidor}</p>
        <h3>4. Proveedor</h3>
        <p>{proveedor.razon_social}{proveedor.ruc ? ` · RUC ${proveedor.ruc}` : ''}<br />{proveedor.direccion}</p>
        <p className="hoja-nota">La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.</p>
        <p className="no-print"><button type="button" className="btn solido" onClick={() => window.print()}>Imprimir / guardar PDF</button>{' '}<a className="btn" href="/">Volver a la tienda</a></p>
      </div>
    );
  }

  return (
    <form className="reclamo" onSubmit={enviar}>
      <div className="hoja-prov">
        <b>Proveedor:</b> {proveedor.razon_social}{proveedor.ruc ? ` · RUC ${proveedor.ruc}` : ''} · {proveedor.direccion}
      </div>

      <h3>1. Identificación del consumidor reclamante</h3>
      <div className="rf-grid">
        <label className="rf-full">Nombre completo *<input required value={f.nombre} onChange={set('nombre')} /></label>
        <label>Tipo de documento *<select value={f.documento_tipo} onChange={set('documento_tipo')}><option>DNI</option><option>CE</option><option>RUC</option><option>Pasaporte</option></select></label>
        <label>N° de documento *<input required value={f.documento_num} onChange={set('documento_num')} /></label>
        <label className="rf-full">Domicilio *<input required value={f.domicilio} onChange={set('domicilio')} /></label>
        <label>Teléfono<input value={f.telefono} onChange={set('telefono')} /></label>
        <label>Correo electrónico *<input required type="email" value={f.email} onChange={set('email')} /></label>
        <label className="rf-check rf-full"><input type="checkbox" checked={f.menor} onChange={set('menor')} /> Soy menor de edad (completar datos del padre, madre o apoderado)</label>
        {f.menor && <label className="rf-full">Nombre del padre, madre o apoderado *<input value={f.apoderado} onChange={set('apoderado')} /></label>}
      </div>

      <h3>2. Identificación del bien contratado</h3>
      <div className="rf-grid">
        <label>Tipo *<select value={f.tipo_bien} onChange={set('tipo_bien')}><option value="producto">Producto</option><option value="servicio">Servicio</option></select></label>
        <label>Monto reclamado (S/)<input type="number" min="0" step="0.01" value={f.monto} onChange={set('monto')} /></label>
        <label className="rf-full">Descripción (código de alfombra, N° de pedido)<input value={f.descripcion_bien} onChange={set('descripcion_bien')} /></label>
      </div>

      <h3>3. Detalle de la reclamación y pedido del consumidor</h3>
      <div className="rf-grid">
        <label className="rf-full">Tipo *
          <select value={f.tipo} onChange={set('tipo')}>
            <option value="reclamo">Reclamo (disconformidad con el producto o servicio)</option>
            <option value="queja">Queja (malestar con la atención, sin relación al producto)</option>
          </select>
        </label>
        <label className="rf-full">Detalle *<textarea required rows={4} value={f.detalle} onChange={set('detalle')} /></label>
        <label className="rf-full">Pedido del consumidor *<textarea required rows={3} value={f.pedido_consumidor} onChange={set('pedido_consumidor')} /></label>
      </div>

      <p className="hoja-nota">* Campos obligatorios. La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI. El proveedor deberá dar respuesta en un plazo no mayor a treinta (30) días calendario.</p>
      {error && <p className="cart-error" role="alert">{error}</p>}
      <button className="btn solido" disabled={cargando} style={{ cursor: 'pointer', fontFamily: 'inherit' }}>{cargando ? 'Enviando…' : 'Enviar hoja de reclamación'}</button>
    </form>
  );
}
