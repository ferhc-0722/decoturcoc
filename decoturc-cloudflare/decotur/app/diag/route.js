import { q } from '../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasUrl = !!process.env.DATABASE_URL;
  try {
    const { rows } = await q('select count(*)::int as n from productos');
    return Response.json({ ok: true, hasUrl, productos: rows[0].n });
  } catch (e) {
    return Response.json({ ok: false, hasUrl, error: String(e.message) }, { status: 500 });
  }
}
