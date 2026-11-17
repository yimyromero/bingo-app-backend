import type { Request } from "express";
import type { Pagination } from "@/schemas/paginationSchema.ts";
import type { AuthRequest } from "@/middleware/verifyJWT.ts";
import { dbConn } from "@/config/dbConn.ts";
import { bingos } from "@/models/bingos.ts";
import { bingoDetails } from "@/models/bingo_details.ts";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

export const getAccessibleBingos = async (
	req: AuthRequest,
	pagination: Pagination
) => {
	const { offset, limit } = pagination;

	const filter = buildOwnershipFilter(req.user);

	return await dbConn
		.select()
		.from(bingos)
		.limit(limit)
		.offset(offset)
		.where(
			and(
				req.user?.role !== "admin"
					? eq(bingos.userId, Number(req.user?.id))
					: undefined
			)
		)
		.orderBy(bingos.id);
};

const buildOwnershipFilter = (user: any) => {
	if (user?.role === "admin") {
		return undefined;
	}

	return { owner: user?.id };
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
