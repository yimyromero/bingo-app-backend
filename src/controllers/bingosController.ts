import { dbConn } from "@/config/dbConn.ts";
import { bingoDetails } from "@/models/bingo_details.ts";
import { bingos } from "@/models/bingos.ts";
import { users } from "@/models/users.ts";
import { paginationSchema } from "@/schemas/paginationSchema.ts";
import { isArrayEmpty } from "@/utils/utils.ts";
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

	await dbConn.transaction(async (tx) => {
		const result = await tx
			.insert(bingos)
			.values({ userId, title, gridSize, raffleDate, isDone })
			.returning({
				id: bingos.id,
				userId: bingos.userId,
				title: bingos.title,
				gridSize: bingos.gridSize,
				raffleDate: bingos.raffleDate,
				idDone: bingos.isDone,
				createdAt: bingos.createdAt,
			});

		if (!result[0]) {
			throw new Error("Failed to create bingo.");
		}
		const createdBingo = result[0];
		const cells = Array.from({ length: createdBingo.gridSize }, (_, i) => ({
			bingoId: createdBingo?.id || 0,
			cellNumber: i + 1,
			participantName: null,
		}));

		await tx.insert(bingoDetails).values(cells);

		return res.status(201).json({ data: createdBingo });
	});
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
