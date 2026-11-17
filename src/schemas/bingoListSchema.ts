import { z } from "zod";
import { paginationSchema } from "./paginationSchema.ts";

export const BINGO_SORT_FIELDS = [
	"createdAt",
	"title",
	"raffleDate",
	"gridSize",
] as const;

/** Query string for GET /bingos: pagination + search, status filter and ordering */
export const bingoListSchema = paginationSchema.safeExtend({
	search: z.string().trim().max(100).optional(),
	status: z.enum(["all", "active", "finished"]).default("all"),
	// raffle date range, inclusive, as YYYY-MM-DD
	raffleFrom: z.iso.date().optional(),
	raffleTo: z.iso.date().optional(),
	sort: z.enum(BINGO_SORT_FIELDS).default("createdAt"),
	order: z.enum(["asc", "desc"]).default("desc"),
});

export type BingoListQuery = z.infer<typeof bingoListSchema>;
