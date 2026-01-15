import {
	uniqueIndex,
	integer,
	pgTable,
	timestamp,
	varchar,
	unique,
} from "drizzle-orm/pg-core";
import { bingo } from "./bingo.ts";

export const bingoDetails = pgTable(
	"bingo_details",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		bingoId: integer()
			.references(() => bingo.id)
			.notNull(),
		cellNumber: integer().notNull(),
		participantName: varchar({ length: 255 }).notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => [
		uniqueIndex("bingo_cell_unique").on(table.bingoId, table.cellNumber),
	]
);
