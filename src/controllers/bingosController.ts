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

/**
 * Add a bingo record
 * @route POST /bingos
 */
const createNewBingo = async (req: Request, res: Response) => {
	const { userId, title, gridSize, raffleDate, isDone } = req.body;

	const [created] = await dbConn
		.insert(bingos)
		.values({ userId, title, gridSize, raffleDate, isDone })
		.returning();

	return res.status(201).json(created);
};

export { getAllBingos, createNewBingo };
