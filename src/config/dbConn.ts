import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

export const dbConn = drizzle(pool, { casing: "snake_case" });
