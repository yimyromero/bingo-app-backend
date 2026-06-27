import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
	pgTable,
	integer,
	varchar,
	text,
	timestamp,
	boolean,
	uniqueIndex,
	check,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";

export const bingos = pgTable(
	"bingo",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		userId: integer()
			.references(() => users.id)
			.notNull(),
		title: varchar({ length: 255 }).notNull(),
		gridSize: integer().default(25).notNull(),
		prizes: text(),
		raffleDate: timestamp().defaultNow(),
		isDone: boolean().default(false),
		createdAt: timestamp().defaultNow(),
	},
	(table) => [
		uniqueIndex("user_bingo_title_unique").on(table.userId, table.title),
		check("positive_grid_size", sql`${table.gridSize} > 0`),
	]
);

export const bingoRelations = relations(bingos, ({ one }) => ({
	user: one(users, {
		fields: [bingos.userId],
		references: [users.id],
	}),
}));
