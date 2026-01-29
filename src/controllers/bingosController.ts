import { dbConn } from "@/config/dbConn.ts";
import { bingos } from "@/models/bingos.ts";
import { users } from "@/models/users.ts";
import { paginationSchema } from "@/schemas/paginationSchema.ts";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import z from "zod";

/**
 * Get all bingo records
 * @route GET /bingos
 */
const getAllBingos = async (req: Request, res: Response) => {
	const parsed = paginationSchema.safeParse(req.query);

	if (!parsed.success) {
		return res.status(400).json({
			message: "Invalid pagination parameters.",
			errors: z.treeifyError(parsed.error),
		});
	}

	const { offset, limit } = parsed.data;

	const result = await dbConn
		.select()
		.from(bingos)
		.limit(limit)
		.offset(offset)
		.orderBy(bingos.id);

	res.json({ data: result, meta: { offset, limit } });
};

export { getAllBingos };
