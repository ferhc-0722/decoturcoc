import { q } from './db';

const DEFAULTS = () => ({
  fondo_inicio: 'animado',
  fondo_nosotros: '#FFFFFF',
  fondo_catalogo: '#F8F3EA',
  fondo_contacto: '#1C1C1C',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '51XXXXXXXXX',
  email: 'contacto@tu-dominio.com',
  direccion: 'Tu dirección aquí',
  horario: 'Lunes a sábado · 10:00 – 19:00',
  yape_qr: '',
  yape_numero: '',
  plin_qr: '',
  plin_numero: '',
  transferencia: '',
  razon_social: '',
  ruc: '',
  facebook: '',
  instagram: '',
  tiktok: '',
  terminos: '',
  devoluciones: '',
});

export async function getAjustes() {
  const out = DEFAULTS();
  const { rows } = await q('select clave, valor from ajustes');
  for (const r of rows) if (r.valor !== '' && r.valor != null) out[r.clave] = r.valor;
  return out;
}
