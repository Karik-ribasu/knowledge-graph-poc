import pg from "pg";

const { Pool } = pg;

export function createPool(connectionString: string): pg.Pool {
  return new Pool({ connectionString });
}

/** Smoke check: connect and run SELECT 1. */
export async function pingDatabase(pool: pg.Pool): Promise<boolean> {
  const result = await pool.query<{ ok: number }>("SELECT 1 AS ok");
  return result.rows[0]?.ok === 1;
}
