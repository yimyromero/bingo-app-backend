import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

interface AccessPayload extends JwtPayload {
	userInfo: {
		id: number;
		role: string;
	};
}

export interface AuthRequest extends Request {
	user?: AccessPayload["userInfo"];
}

export const verifyJWT = (
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

	try {
		const decoded = jwt.verify(
			token,
			process.env.ACCESS_TOKEN_SECRET as string
		) as AccessPayload;
		req.user = decoded.userInfo;
		next();
	} catch (error) {
		return res.sendStatus(403);
	}
};
