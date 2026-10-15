import { q } from '../../lib/db';
import { getAjustes } from '../../lib/ajustes';

export const dynamic = 'force-dynamic';

export async function GET() {
  const pasos = {};
  const probar = async (nombre, fn) => {
    try { pasos[nombre] = await fn(); } catch (e) { pasos[nombre] = 'ERROR: ' + String(e.message); }
  };
  await probar('ajustes', async () => Object.keys(await getAjustes()).length);
  await probar('productos', async () => (await q('select id, codigo, color, precio_min, precio_max, estado, foto_url, descripcion from productos')).rows.length);
  await probar('medidas', async () => (await q('select medida from medidas')).rows.length);
  await probar('producto_medidas', async () => (await q('select pm.producto_id, m.medida, pm.precio from producto_medidas pm join medidas m on m.id = pm.medida_id')).rows.length);
  return Response.json({ hasUrl: !!process.env.DATABASE_URL, pasos });
}
