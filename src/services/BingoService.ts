import type { Request } from "express";
import type { BingoListQuery } from "@/schemas/bingoListSchema.ts";
import type { AuthRequest } from "@/middleware/verifyJWT.ts";
import { dbConn } from "@/config/dbConn.ts";
import { bingos } from "@/models/bingos.ts";
import { bingoDetails } from "@/models/bingo_details.ts";
import { and, asc, count, desc, eq, gte, ilike, isNotNull, lt, sql } from "drizzle-orm";

const nextDay = (date: string) => {
	const d = new Date(`${date}T00:00:00`);
	d.setDate(d.getDate() + 1);
	return d;
};

const sortColumns = {
	createdAt: bingos.createdAt,
	title: bingos.title,
	raffleDate: bingos.raffleDate,
	gridSize: bingos.gridSize,
};

/**
 * One page of the bingos the user can see (all for admins), with the
 * total matching rows so the client can paginate.
 */
export const getAccessibleBingos = async (
	req: AuthRequest,
	query: BingoListQuery
) => {
	const { offset, limit, search, status, sort, order, raffleFrom, raffleTo } =
		query;

	// escape LIKE wildcards so the search text is matched literally
	const escaped = search?.replace(/[\\%_]/g, "\\$&");

	const where = and(
		req.user?.role !== "admin"
			? eq(bingos.userId, Number(req.user?.id))
			: undefined,
		escaped ? ilike(bingos.title, `%${escaped}%`) : undefined,
		status === "active" ? eq(bingos.isDone, false) : undefined,
		status === "finished" ? eq(bingos.isDone, true) : undefined,
		raffleFrom ? gte(bingos.raffleDate, new Date(`${raffleFrom}T00:00:00`)) : undefined,
		// the end day is included, so compare against the start of the next day
		raffleTo ? lt(bingos.raffleDate, nextDay(raffleTo)) : undefined
	);

	const direction = order === "asc" ? asc : desc;

	const [rows, totals] = await Promise.all([
		dbConn
			.select()
			.from(bingos)
			.where(where)
			// id as tiebreaker keeps pages stable
			.orderBy(direction(sortColumns[sort]), direction(bingos.id))
			.limit(limit)
			.offset(offset),
		dbConn
			.select({ total: count() })
			.from(bingos)
			.where(where),
	]);

	return { rows, total: totals[0]?.total ?? 0 };
};

/**
 * Dashboard data: one row per accessible bingo with its taken count,
 * plus the most recently taken spots. Same ownership rule as the bingo list.
 */
export const getDashboardSummary = async (req: AuthRequest) => {
	const ownerFilter =
		req.user?.role !== "admin"
			? eq(bingos.userId, Number(req.user?.id))
			: undefined;

	const bingoRows = await dbConn
		.select({
			id: bingos.id,
			title: bingos.title,
			gridSize: bingos.gridSize,
			raffleDate: bingos.raffleDate,
			isDone: bingos.isDone,
			taken: sql<number>`count(${bingoDetails.id}) filter (where btrim(coalesce(${bingoDetails.participantName}, '')) <> '')`.mapWith(
				Number
			),
			lastUpdated: sql<string | null>`max(${bingoDetails.updatedAt})`,
		})
		.from(bingos)
		.leftJoin(bingoDetails, eq(bingoDetails.bingoId, bingos.id))
		.where(ownerFilter)
		.groupBy(bingos.id)
		.orderBy(bingos.raffleDate);

	const recent = await dbConn
		.select({
			bingoId: bingos.id,
			bingoTitle: bingos.title,
			cellNumber: bingoDetails.cellNumber,
			participantName: bingoDetails.participantName,
			takenAt: bingoDetails.takenAt,
		})
		.from(bingoDetails)
		.innerJoin(bingos, eq(bingoDetails.bingoId, bingos.id))
		.where(and(isNotNull(bingoDetails.takenAt), ownerFilter))
		.orderBy(desc(bingoDetails.takenAt))
		.limit(8);

	return { bingos: bingoRows, recent };
};
