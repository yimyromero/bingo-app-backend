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

export const verifyIsAdmin = (
	req: AuthRequest,
	res: Response,
	next: NextFunction
) => {
	if (req.user && req.user.role === "admin") return next();
	return res.sendStatus(403);
};
