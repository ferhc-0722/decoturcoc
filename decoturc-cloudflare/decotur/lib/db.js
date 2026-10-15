import { Pool } from '@neondatabase/serverless';

// Driver compatible con Cloudflare Workers (usa WebSocket, no sockets TCP).
// La conexión se crea en la primera consulta, cuando ya existe DATABASE_URL.
const g = globalThis;

function getPool() {
  if (!g.__neonPool) {
    g.__neonPool = new Pool({ connectionString: process.env.DATABASE_URL || '' });
  }
  return g.__neonPool;
}

// Mantiene la misma API que antes: pool.query(...), pool.connect(), etc.
export const pool = new Proxy({}, {
  get(_, prop) {
    const p = getPool();
    const v = p[prop];
    return typeof v === 'function' ? v.bind(p) : v;
  },
});

export const q = (text, params) => pool.query(text, params);
