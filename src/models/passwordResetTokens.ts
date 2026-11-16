import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users.ts";

// Only the SHA-256 hash of a reset token is stored, never the token itself.
export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	userId: integer()
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
	tokenHash: varchar({ length: 64 }).notNull().unique(),
	expiresAt: timestamp().notNull(),
	createdAt: timestamp().defaultNow().notNull(),
});
