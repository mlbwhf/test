import pg from "pg";

export type Pool = pg.Pool;
export type Queryable = Pick<pg.PoolClient, "query">;

export function createPool(databaseUrl: string): Pool {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 10 });
  // bigint (int8) -> number; amounts are safe integers by construction.
  pg.types.setTypeParser(20, (v) => Number(v));
  return pool;
}

export async function withTransaction<T>(pool: Pool, fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}
