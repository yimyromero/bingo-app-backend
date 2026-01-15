import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const dbUrl = process.env.DATABASE_URL;
console.log(dbUrl);
if (!dbUrl) {
	throw new Error("DATABASE_URL environment variable is not set");
}

export default defineConfig({
	dialect: "postgresql",
	out: "./drizzle",
	schema: "./src/models",
	casing: "snake_case",
	dbCredentials: {
		url: dbUrl,
	},
});
