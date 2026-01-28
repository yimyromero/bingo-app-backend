import { dbConn } from "@/config/dbConn.ts";
import { bingos } from "@/models/bingos.ts";
import { users } from "@/models/users.ts";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";

/**
 * Get all bingo records
 * @route GET /bingos
 */
const getAllBingos = async (req: Request, res: Response) => {
	const [result] = await dbConn.select().from(bingos);

	if (!result) {
		return res.status(400).json({ message: "There are no bingo records." });
	}

	res.json(result);
};

export { getAllBingos };
