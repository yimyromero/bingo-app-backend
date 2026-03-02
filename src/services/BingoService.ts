import type { Request } from "express";
import type { Pagination } from "@/schemas/paginationSchema.ts";
import type { AuthRequest } from "@/middleware/verifyJWT.ts";
import { dbConn } from "@/config/dbConn.ts";
import { bingos } from "@/models/bingos.ts";
import { and, eq, SQL } from "drizzle-orm";

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
