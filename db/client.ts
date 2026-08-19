import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var _pgClient: ReturnType<typeof postgres> | undefined;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida");
}

const client = globalThis._pgClient ?? postgres(process.env.DATABASE_URL, { max: 5 });
if (process.env.NODE_ENV !== "production") globalThis._pgClient = client;

export const sql = client;
