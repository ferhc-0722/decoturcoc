'use server';
import { pool } from '../lib/db';

const txt = (v, max = 300) => (v == null ? '' : String(v).trim().slice(0, max));
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// Crea un pedido "pendiente". Los precios SIEMPRE se leen de la base de datos, nunca del navegador.
export async function crearPedido(datos, items) {
  try {
    const nombre = txt(datos?.nombre, 120), email = txt(datos?.email, 120);
    const telefono = txt(datos?.telefono, 30), documento = txt(datos?.documento, 20);
    const direccion = txt(datos?.direccion, 200), ciudad = txt(datos?.ciudad, 80), notas = txt(datos?.notas, 400);
    if (!nombre || !emailOk(email) || !telefono || !direccion || !ciudad) {
      return { ok: false, error: 'Completa nombre, correo válido, teléfono, dirección y ciudad.' };
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
      return { ok: false, error: 'Tu carrito está vacío.' };
    }
    const lineas = [];
    let total = 0;
    for (const it of items) {
      const qty = Math.trunc(Number(it?.qty));
      if (!Number.isFinite(qty) || qty < 1 || qty > 20) return { ok: false, error: 'Cantidad inválida.' };
      const { rows } = await pool.query(
        `select p.id, p.codigo, p.color, p.estado, m.medida, pm.precio
           from producto_medidas pm
           join medidas m on m.id = pm.medida_id
           join productos p on p.id = pm.producto_id
          where p.id = $1 and m.medida = $2`,
        [Number(it?.producto_id), String(it?.medida)]
      );
      const r = rows[0];
      if (!r) return { ok: false, error: 'Un producto del carrito ya no existe.' };
      if (r.estado === 'agotado') return { ok: false, error: `La alfombra ${r.codigo} ${r.color} está agotada.` };
      const precio = Number(r.precio);
      if (!(precio > 0)) return { ok: false, error: `La alfombra ${r.codigo} ${r.color} (${r.medida}) no tiene precio. Consúltanos por WhatsApp.` };
      lineas.push({ producto_id: r.id, codigo: r.codigo, color: r.color, medida: r.medida, precio, qty });
      total += precio * qty;
    }
    total = Math.round(total * 100) / 100;
    const ins = await pool.query(
      `insert into pedidos (nombre, email, telefono, documento, direccion, ciudad, notas, items, total)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
      [nombre, email, telefono, documento, direccion, ciudad, notas, JSON.stringify(lineas), total]
    );
    return { ok: true, id: ins.rows[0].id, total, centavos: Math.round(total * 100), email, nombre };
  } catch (e) {
    console.error('crearPedido', e);
    return { ok: false, error: 'No pudimos registrar tu pedido. Inténtalo de nuevo.' };
  }
}

// Registra un reclamo/queja en el Libro de Reclamaciones (guardado en la base de datos).
export async function crearReclamo(f) {
  try {
    const d = {
      nombre: txt(f?.nombre, 150), documento_tipo: ['DNI', 'CE', 'RUC', 'Pasaporte'].includes(f?.documento_tipo) ? f.documento_tipo : 'DNI',
      documento_num: txt(f?.documento_num, 20), domicilio: txt(f?.domicilio, 250), telefono: txt(f?.telefono, 30),
      email: txt(f?.email, 120), menor: !!f?.menor, apoderado: txt(f?.apoderado, 150),
      tipo_bien: f?.tipo_bien === 'servicio' ? 'servicio' : 'producto',
      monto: Number(f?.monto) > 0 ? Number(f.monto) : null, descripcion_bien: txt(f?.descripcion_bien, 400),
      tipo: f?.tipo === 'queja' ? 'queja' : 'reclamo', detalle: txt(f?.detalle, 2000), pedido_consumidor: txt(f?.pedido_consumidor, 1000),
    };
    if (!d.nombre || !d.documento_num || !d.domicilio || !emailOk(d.email) || !d.detalle || !d.pedido_consumidor) {
      return { ok: false, error: 'Completa todos los campos obligatorios (*).' };
    }
    if (d.menor && !d.apoderado) return { ok: false, error: 'Indica el nombre del padre, madre o apoderado.' };
    const c = await pool.connect();
    try {
      await c.query('begin');
      const ins = await c.query(
        `insert into reclamos (nombre, documento_tipo, documento_num, domicilio, telefono, email, menor, apoderado,
           tipo_bien, monto, descripcion_bien, tipo, detalle, pedido_consumidor)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning id, creado`,
        [d.nombre, d.documento_tipo, d.documento_num, d.domicilio, d.telefono, d.email, d.menor, d.apoderado || null,
         d.tipo_bien, d.monto, d.descripcion_bien, d.tipo, d.detalle, d.pedido_consumidor]
      );
      const { id, creado } = ins.rows[0];
      const codigo = `${String(id).padStart(4, '0')}-${new Date(creado).getFullYear()}`;
      await c.query('update reclamos set codigo=$2 where id=$1', [id, codigo]);
      await c.query('commit');
      return { ok: true, codigo, fecha: new Date(creado).toISOString(), datos: d };
    } catch (e) {
      await c.query('rollback');
      throw e;
    } finally {
      c.release();
    }
  } catch (e) {
    console.error('crearReclamo', e);
    return { ok: false, error: 'No pudimos registrar tu hoja de reclamación. Inténtalo de nuevo.' };
  }
}
