import { pool } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

// Recibe el token de Culqi (generado en el navegador) y crea el cargo con la llave SECRETA.
// El monto sale del pedido guardado en la base de datos, nunca del navegador.
export async function POST(req) {
  const json = (body, status = 200) => Response.json(body, { status });
  try {
    const sk = process.env.CULQI_SECRET_KEY;
    if (!sk) return json({ ok: false, error: 'El pago con tarjeta aún no está configurado.' }, 500);

    const { pedidoId, token } = await req.json();
    if (!pedidoId || !token || typeof token !== 'string') return json({ ok: false, error: 'Solicitud inválida.' }, 400);

    const { rows } = await pool.query('select * from pedidos where id=$1', [Number(pedidoId)]);
    const p = rows[0];
    if (!p) return json({ ok: false, error: 'Pedido no encontrado.' }, 404);
    if (p.estado === 'pagado') return json({ ok: true, pedido: p.id });

    const r = await fetch('https://api.culqi.com/v2/charges', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sk}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(Number(p.total) * 100),
        currency_code: 'PEN',
        email: p.email,
        source_id: token,
        description: `Pedido #${p.id} Deco Turco`,
        metadata: { pedido: String(p.id) },
      }),
    });
    const data = await r.json().catch(() => ({}));

    if (r.ok && data.object === 'charge' && data.id) {
      await pool.query("update pedidos set estado='pagado', culqi_charge_id=$2, error=null where id=$1", [p.id, data.id]);
      await pool.query(
        "insert into movimientos (tipo, categoria, descripcion, monto) values ('venta','Culqi',$1,$2)",
        [`Pedido web #${p.id} · ${p.nombre}`, p.total]
      );
      return json({ ok: true, pedido: p.id });
    }

    const msg = data.user_message || data.merchant_message || 'El pago fue rechazado.';
    await pool.query("update pedidos set estado='fallido', error=$2 where id=$1", [p.id, String(msg).slice(0, 300)]);
    return json({ ok: false, error: msg }, 402);
  } catch (e) {
    console.error('culqi cargo', e);
    return json({ ok: false, error: 'Error al procesar el pago.' }, 500);
  }
}
