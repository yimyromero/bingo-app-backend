import { dbConn } from "@/config/dbConn.ts";
import { bingoDetails } from "@/models/bingo_details.ts";
import { bingos } from "@/models/bingos.ts";
import { isArrayEmpty } from "@/utils/utils.ts";
import { eq, and } from "drizzle-orm";
import type { Request, Response } from "express";
import type { BingoDetailInput } from "@/schemas/bingoSchema.ts";

/**
 * Get details(cells) for one bingo
 * @route GET /bingo/:bingoId/details
 */
const getBingoDetailsById = async (req: Request, res: Response) => {
	const { bingoId } = req.params;

	if (!bingoId) {
		return res.status(400).json({ message: "The bingo ID is required." });
	}

	const bingoDetail = await dbConn
		.select()
		.from(bingoDetails)
		.where(eq(bingoDetails.bingoId, Number(bingoId)));

	if (Array.isArray(bingoDetail) && bingoDetail.length === 0) {
		return res
			.status(404)
			.json({ message: "There is no detail data for this bingo ID." });
	}

	res.json(bingoDetail);
};

/**
 * Insert details(cells) for a bingo
 * @route POST /bingo/:bingoId/details
 */
const createBingoDetailsById = async (req: Request, res: Response) => {
	const { bingoId } = req.params;
	const { details } = req.body;

	if (!bingoId || isArrayEmpty(details)) {
		return res
			.status(400)
			.json({ message: "The bingo ID and details are required." });
	}

	const rows = details.map((row: BingoDetailInput) => ({ bingoId, ...row }));

	const [created] = await dbConn.insert(bingoDetails).values(rows).returning();

	res.status(201).json({ message: "Details added." });
};

/**
 * Update details(cells) for a bingo
 * @route PATCH /bingo/:bingoId/details
 */
const updateBingoDetailsById = async (req: Request, res: Response) => {
	const bingoId = Number(req.params.bingoId);
	const { details } = req.body;

	if (!bingoId || isArrayEmpty(details)) {
		return res.status(400).json({ message: "Invalid payload." });
	}

	await dbConn.transaction(async (tx) => {
		const [bingo] = await tx
			.select({ gridSize: bingos.gridSize })
			.from(bingos)
			.where(eq(bingos.id, bingoId));

		if (!bingo) {
			return res.status(404).json({ message: "Bingo not found." });
		}

		const { gridSize } = bingo;

		const invalidCell = details.find(
			(d: any) => d.cellNumber < 1 || d.cellNumber > gridSize
		);

		if (invalidCell) {
			return res.status(400).json({
				message: `Invalid cellNumber ${invalidCell.cellNumber}. Must be between 1 and ${gridSize}`,
			});
		}

		await Promise.all(
			details.map((row: BingoDetailInput) =>
				tx
					.update(bingoDetails)
					.set({ participantName: row.participantName })
					.where(
						and(
							eq(bingoDetails.bingoId, bingoId),
							eq(bingoDetails.cellNumber, row.cellNumber)
						)
					)
			)
		);
		res.status(201).json({ message: "Details updated." });
	});
};
export { getBingoDetailsById, createBingoDetailsById, updateBingoDetailsById };
