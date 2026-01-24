import {
	pgTable,
	varchar,
	integer,
	text,
	timestamp,
	boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: varchar({ length: 255 }),
	email: varchar({ length: 255 }).notNull().unique(),
	password_hash: text().notNull(),
	roles: varchar({ length: 50 }).default("user"),
	created_at: timestamp().defaultNow(),
	active: boolean().default(false),
});
