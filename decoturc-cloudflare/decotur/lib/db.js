import { neon, Pool } from '@neondatabase/serverless';

// HTTP queries are stateless and safe to reuse across Workers requests.
// Keep WebSocket pools local to explicit transactions and close them before release.
const g = globalThis;

function getHttpQuery() {
  if (!g.__neonHttpQuery) {
    g.__neonHttpQuery = neon(process.env.DATABASE_URL || '', { fullResults: true });
  }
  return g.__neonHttpQuery;
}

export const pool = {
  query(...args) {
    return getHttpQuery().query(...args);
  },

  async connect() {
    const p = new Pool({ connectionString: process.env.DATABASE_URL || '' });
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
