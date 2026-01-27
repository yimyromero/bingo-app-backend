import {
	pgTable,
	varchar,
	integer,
	text,
	timestamp,
	boolean,
	pgEnum,
} from "drizzle-orm/pg-core";

export const rolesEnum = pgEnum("roles", ["guest", "user", "manager", "admin"]);

export const users = pgTable("users", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	email: varchar({ length: 255 }).notNull().unique(),
	password_hash: text().notNull(),
	name: varchar({ length: 255 }),
	roles: rolesEnum().default("user"),
	created_at: timestamp().defaultNow(),
	active: boolean().default(true),
});
