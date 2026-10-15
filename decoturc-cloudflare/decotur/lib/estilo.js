// Convierte el valor de fondo ("animado", "#hex" o URL) en estilo CSS
export function estiloFondo(v) {
  if (!v || v === 'animado' || v === 'video') return {};
  if (v.startsWith('http')) {
    return { backgroundImage: `url("${v}")`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  return { background: v };
}

// ¿La URL apunta a un archivo de video?
export function esVideoUrl(v) {
  return typeof v === 'string' && /^https?:\/\/[^\s]+\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(v.trim());
}
