import { Pool } from '@neondatabase/serverless';

// Workers no permite reutilizar conexiones creadas durante otra solicitud.
// Crear y cerrar cada pool evita el error 1101 por I/O entre solicitudes.
function createPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL || '' });
}

export const pool = {
  async query(...args) {
    const p = createPool();
    try {
      return await p.query(...args);
    } finally {
      await p.end();
    }
  },

  async connect() {
    const p = createPool();
    try {
      const client = await p.connect();
      const release = client.release.bind(client);
      let closed = false;
      client.release = async (...args) => {
        if (closed) return;
        closed = true;
        release(...args);
        await p.end();
      };
      return client;
    } catch (error) {
      await p.end();
      throw error;
    }
  },
};

export const q = (text, params) => pool.query(text, params);
