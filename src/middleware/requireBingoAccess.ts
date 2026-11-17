import { dbConn } from "@/config/dbConn.ts";
import { bingos } from "@/models/bingos.ts";
import { eq } from "drizzle-orm";
import type { NextFunction, Response } from "express";
import type { AuthRequest } from "./verifyJWT.ts";

/**
 * Only the owner of the bingo (or an admin) may continue.
 * Expects a :bingoId route param and must run after verifyJWT.
 */
export const requireBingoAccess = async (
	req: AuthRequest,
	res: Response,
	next: NextFunction
) => {
	const bingoId = Number(req.params.bingoId);

	if (!Number.isInteger(bingoId) || bingoId <= 0) {
		return res.status(400).json({ message: "Invalid bingo ID." });
	}

	try {
		const [bingo] = await dbConn
			.select({ userId: bingos.userId })
			.from(bingos)
			.where(eq(bingos.id, bingoId));

		if (!bingo) {
			return res.status(404).json({ message: "Bingo not found." });
		}

		if (req.user?.role !== "admin" && bingo.userId !== Number(req.user?.id)) {
			return res.status(403).json({ message: "Forbidden." });
		}

		next();
	} catch {
		res.status(500).json({ message: "Server error" });
	}
};
