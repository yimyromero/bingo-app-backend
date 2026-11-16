import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { dbConn } from "@/config/dbConn.ts";
import { users } from "@/models/users.ts";

interface AccessPayload extends JwtPayload {
	userInfo: {
		id: number;
		role: string;
	};
	// token version at the time of issue
	tv?: number;
}

export interface AuthRequest extends Request {
	user?: AccessPayload["userInfo"];
}

export const verifyJWT = async (
	req: AuthRequest,
	res: Response,
	next: NextFunction
) => {
	const authHeader = req.headers.authorization;

	if (!authHeader?.startsWith("Bearer ")) {
		return res.sendStatus(401);
	}

	const token = authHeader.split(" ")[1] ?? "";

	if (!process.env.ACCESS_TOKEN_SECRET) {
		return res.sendStatus(500);
	}

	let decoded: AccessPayload;
	try {
		decoded = jwt.verify(
			token,
			process.env.ACCESS_TOKEN_SECRET as string
		) as AccessPayload;
	} catch (error) {
		return res.sendStatus(403);
	}

	// Reject tokens of disabled accounts or issued before a revocation
	// (deactivation / password reset), instead of waiting for them to expire.
	const [user] = await dbConn
		.select({ active: users.active, tokenVersion: users.token_version })
		.from(users)
		.where(eq(users.id, Number(decoded.userInfo?.id)));

	if (!user || !user.active || user.tokenVersion !== decoded.tv) {
		return res.sendStatus(403);
	}

	req.user = decoded.userInfo;
	next();
};
