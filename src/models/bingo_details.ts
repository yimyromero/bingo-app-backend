import {
	uniqueIndex,
	integer,
	pgTable,
	timestamp,
	varchar,
	unique,
} from "drizzle-orm/pg-core";
import { bingos } from "./bingos.ts";

export const bingoDetails = pgTable(
	"bingo_details",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		bingoId: integer()
			.references(() => bingos.id)
			.notNull(),
		cellNumber: integer().notNull(),
		participantName: varchar({ length: 255 }).notNull(),
		createdAt: timestamp().defaultNow(),
	},
	(table) => [
		uniqueIndex("bingo_cell_unique").on(table.bingoId, table.cellNumber),
	]
);
