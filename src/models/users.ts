import {
	pgTable,
	varchar,
	integer,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	email: varchar({ length: 255 }).notNull().unique(),
	password_hash: text().notNull(),
	name: varchar({ length: 255 }),
	role: varchar({ length: 50 }).default("user"),
	created_at: timestamp().defaultNow(),
});
