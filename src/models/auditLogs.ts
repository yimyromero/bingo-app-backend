import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// No foreign keys on purpose: audit rows must outlive the users they mention.
export const auditLogs = pgTable("audit_logs", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	adminId: integer().notNull(),
	targetUserId: integer().notNull(),
	action: varchar({ length: 50 }).notNull(),
	createdAt: timestamp().defaultNow().notNull(),
});
