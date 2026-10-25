import { Pool } from '@neondatabase/serverless';

// Keep each database pool inside the request/query that uses it. Cloudflare
// Workers can reuse a module between requests, so a module-level pool can
// carry I/O state into a different request.
export const pool = {
  async query(...args) {
    const p = new Pool({ connectionString: process.env.DATABASE_URL || '' });
    try {
      return await p.query(...args);
    } finally {
      await p.end();
    }
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
