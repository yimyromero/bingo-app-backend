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

/**
 * Update a bingo record
 * @route PATCH /bingos
 */
const updateBingo = async (req: Request, res: Response) => {
	const { id, userId, title, gridSize, raffleDate, isDone } = req.body;

	const [bingo] = await dbConn.select(id).from(bingos).where(eq(bingos.id, id));

	if (!bingo) {
		return res.status(400).json({ message: "bingo record doesn't exist." });
	}

	bingo.userId = userId;
	bingo.title = title;
	bingo.gridSize = gridSize;
	bingo.raffleDate = raffleDate;
	bingo.isDone = isDone;

	const [updatedBingo]: { updatedId: Number }[] = await dbConn
		.update(bingos)
		.set(bingo)
		.where(eq(bingos.id, id))
		.returning({ updatedId: bingos.id });

	res.json({
		message: `bingo ${updatedBingo?.updatedId} updated.`,
	});
};

const deleteBingo = async (req: Request, res: Response) => {
	const { id } = req.body;

	if (!id) {
		return res.status(400).json({ message: "Bingo id is required." });
	}

	const [deletedBingo]: { deletedId: Number }[] = await dbConn
		.delete(bingos)
		.where(eq(bingos.id, id))
		.returning({ deletedId: bingos.id });

	if (!deletedBingo) {
		return res.status(400).json({ message: `Bingo id:${id} doesn't exist.` });
	}

	res.json({ message: `Bingo ${deletedBingo.deletedId} deleted.` });
};

export { getAllBingos, createNewBingo, updateBingo, deleteBingo };
