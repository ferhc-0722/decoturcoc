'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { pool } from '../lib/db';
import { isAdmin, startSession, endSession } from '../lib/auth';

const needAdmin = () => { if (!isAdmin()) throw new Error('No autorizado'); };
const num = (v, def = 0) => { const n = Number(v); return Number.isFinite(n) ? n : def; };
const txt = (v) => (v == null ? '' : String(v).trim());
const refrescar = () => { revalidatePath('/'); revalidatePath('/admin'); };

export async function loginAction(formData) {
  const ip = headers().get('cf-connecting-ip') || 'unknown';
  const ok = await startSession(txt(formData.get('password')), ip);
  redirect(ok ? '/admin' : '/admin?error=1');
}

export async function logoutAction() {
  endSession();
  redirect('/admin');
}

export async function marcarPedidoFallido(formData) {
  needAdmin();
  const id = num(formData.get('id'));
  const c = await pool.connect();
  try {
    await c.query('begin');
    const pedido = (await c.query("select items from pedidos where id=$1 and estado='pendiente' for update", [id])).rows[0];
    if (pedido) {
      const lineas = Array.isArray(pedido.items) ? pedido.items : JSON.parse(pedido.items || '[]');
      const cantidades = new Map();
      for (const item of lineas) {
        const key = String(item.producto_id) + ':' + String(item.medida);
        cantidades.set(key, (cantidades.get(key) || 0) + Math.trunc(num(item.qty)));
      }
      for (const [key, cantidad] of cantidades) {
        const parts = key.split(':');
        await c.query(
          'update producto_medidas pm set stock=pm.stock+$3 from medidas m where pm.producto_id=$1 and pm.medida_id=m.id and m.medida=$2',
          [Number(parts[0]), parts.slice(1).join(':'), cantidad]
        );
      }
      await c.query("update pedidos set estado='fallido' where id=$1", [id]);
    }
    await c.query('commit');
  } catch (e) {
    await c.query('rollback');
    throw e;
  } finally {
    await c.release();
  }
  refrescar();
}

export async function saveProduct(formData) {
  needAdmin();
  const id = num(formData.get('id'));
  const pmin = num(formData.get('precio_min')), pmax = num(formData.get('precio_max'));
  const stock = Math.trunc(num(formData.get('stock')));
  const estado = formData.get('estado') === 'agotado' ? 'agotado' : 'disponible';
  const foto = txt(formData.get('foto_url')) || null;
  const desc = txt(formData.get('descripcion')) || null;

  const medidas = {};
  for (const [k, v] of formData.entries()) {
    const m = k.match(/^m_(\d+)_(precio|stock)$/);
    if (!m) continue;
    medidas[m[1]] = medidas[m[1]] || {};
    medidas[m[1]][m[2]] = v;
  }

  const c = await pool.connect();
  try {
    await c.query('begin');
    const old = (await c.query('select precio_min, precio_max from productos where id=$1', [id])).rows[0];
    if (old && (Number(old.precio_min) !== pmin || Number(old.precio_max) !== pmax)) {
      await c.query('insert into historial_precios (producto_id, precio_min, precio_max) values ($1,$2,$3)',
        [id, old.precio_min, old.precio_max]);
    }
    await c.query(
      'update productos set precio_min=$2, precio_max=$3, stock=$4, estado=$5, foto_url=$6, descripcion=$7, actualizado=now() where id=$1',
      [id, pmin, pmax, stock, estado, foto, desc]
    );
    for (const [mid, d] of Object.entries(medidas)) {
      const precio = txt(d.precio) === '' ? null : num(d.precio);
      await c.query('update producto_medidas set precio=$3, stock=$4 where producto_id=$1 and medida_id=$2',
        [id, Number(mid), precio, Math.trunc(num(d.stock))]);
    }
    await c.query('commit');
  } catch (e) {
    await c.query('rollback');
    throw e;
  } finally {
    await c.release();
  }
  refrescar();
}

export async function createProduct(formData) {
  needAdmin();
  const { rows } = await pool.query(
    'insert into productos (codigo, color, precio_min, precio_max, stock) values ($1,$2,$3,$4,$5) on conflict (codigo, color) do nothing returning id',
    [txt(formData.get('codigo')), txt(formData.get('color')), num(formData.get('precio_min')),
     num(formData.get('precio_max')), Math.trunc(num(formData.get('stock')))]
  );
  if (rows[0]) {
    await pool.query('insert into producto_medidas (producto_id, medida_id) select $1, id from medidas on conflict do nothing', [rows[0].id]);
  }
  refrescar();
}

export async function deleteProduct(formData) {
  needAdmin();
  if (formData.get('confirmar') !== 'si') return;
  await pool.query('delete from productos where id=$1', [num(formData.get('id'))]);
  refrescar();
}

export async function createMovement(formData) {
  needAdmin();
  const tipo = txt(formData.get('tipo'));
  if (!['venta', 'compra', 'gasto', 'ingreso'].includes(tipo)) throw new Error('Tipo inválido');
  const pid = txt(formData.get('producto_id')) ? num(formData.get('producto_id')) : null;
  const cant = Math.max(0, Math.trunc(num(formData.get('cantidad'))));
  const fecha = txt(formData.get('fecha')) || new Date().toISOString().slice(0, 10);

  const c = await pool.connect();
  try {
    await c.query('begin');
    await c.query(
      'insert into movimientos (fecha, tipo, categoria, descripcion, monto, producto_id, cantidad) values ($1,$2,$3,$4,$5,$6,$7)',
      [fecha, tipo, txt(formData.get('categoria')), txt(formData.get('descripcion')), num(formData.get('monto')), pid, cant]
    );
    if (pid && cant > 0 && (tipo === 'venta' || tipo === 'compra')) {
      const delta = tipo === 'venta' ? -cant : cant;
      await c.query('update productos set stock = stock + $2 where id=$1', [pid, delta]);
    }
    await c.query('commit');
  } catch (e) {
    await c.query('rollback');
    throw e;
  } finally {
    await c.release();
  }
  refrescar();
}

export async function deleteMovement(formData) {
  needAdmin();
  const c = await pool.connect();
  try {
    await c.query('begin');
    const mov = (await c.query('select * from movimientos where id=$1', [num(formData.get('id'))])).rows[0];
    if (mov) {
      if (mov.producto_id && mov.cantidad > 0 && (mov.tipo === 'venta' || mov.tipo === 'compra')) {
        const delta = mov.tipo === 'venta' ? mov.cantidad : -mov.cantidad;
        await c.query('update productos set stock = stock + $2 where id=$1', [mov.producto_id, delta]);
      }
      await c.query('delete from movimientos where id=$1', [mov.id]);
    }
    await c.query('commit');
  } catch (e) {
    await c.query('rollback');
    throw e;
  } finally {
    await c.release();
  }
  refrescar();
}

export async function saveAjustes(formData) {
  needAdmin();
  const claves = ['whatsapp', 'fondo_inicio', 'fondo_nosotros', 'fondo_catalogo', 'fondo_contacto', 'email', 'direccion', 'horario',
    'yape_qr', 'yape_numero', 'plin_qr', 'plin_numero', 'transferencia',
    'razon_social', 'ruc', 'facebook', 'instagram', 'tiktok', 'terminos', 'devoluciones'];
  for (const k of claves) {
    let v = txt(formData.get(k));
    if (k === 'whatsapp') v = v.replace(/\D/g, '');
    await pool.query(
      'insert into ajustes (clave, valor) values ($1, $2) on conflict (clave) do update set valor = excluded.valor',
      [k, v]
    );
  }
  refrescar();
}

// Precio por medida para TODOS los productos de un mismo rango de precios (mín–máx)
export async function savePreciosTier(formData) {
  needAdmin();
  const pmin = num(formData.get('tier_min')), pmax = num(formData.get('tier_max'));
  for (const [k, v] of formData.entries()) {
    const m = k.match(/^p_(\d+)$/);
    if (!m || txt(v) === '') continue;
    const precio = num(v);
    if (!(precio > 0)) continue;
    await pool.query(
      `update producto_medidas set precio=$1
        where medida_id=$2 and producto_id in (select id from productos where precio_min=$3 and precio_max=$4)`,
      [precio, Number(m[1]), pmin, pmax]
    );
  }
  refrescar();
}

export async function responderReclamo(formData) {
  needAdmin();
  const id = num(formData.get('id'));
  const resp = txt(formData.get('respuesta'), 2000);
  if (formData.get('estado') === 'atendido') {
    await pool.query("update reclamos set respuesta=$2, estado='atendido', fecha_respuesta=now() where id=$1", [id, resp]);
  } else {
    await pool.query("update reclamos set respuesta=$2, estado='pendiente', fecha_respuesta=null where id=$1", [id, resp]);
  }
  refrescar();
}
