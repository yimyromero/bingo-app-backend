import { dbConn } from "@/config/dbConn.ts";
import { bingoDetails } from "@/models/bingo_details.ts";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";

/**
 * Get details(cells) for one bingo
 * @route /bingo:id
 */
const getBingoDetailsById = async (req: Request, res: Response) => {
	const { bingoId } = req.body;

	if (!bingoId) {
		return res.status(400).json({ message: "The bingo ID is required." });
	}

	const bingoDetail = await dbConn
		.select()
		.from(bingoDetails)
		.where(eq(bingoDetails.bingoId, bingoId));

	if (Array.isArray(bingoDetail) && bingoDetail.length === 0) {
		return res
			.status(404)
			.json({ message: "There is no detail data for this bingo ID." });
	}

	res.json(bingoDetail);
};

export { getBingoDetailsById };
