import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { users } from "@/models/users.ts";
import { dbConn } from "@/config/dbConn.ts";
import { eq } from "drizzle-orm";
import { consumeResetToken } from "@/services/PasswordResetService.ts";

interface RefreshPayload extends JwtPayload {
	id: number;
	tv?: number;
}

// @desc Login
// @route POST /auth
// @access Public
const login = async (req: Request, res: Response) => {
	const { email, password, rememberMe } = req.body;
	const keepSignedIn = rememberMe === true;

	const JWT_ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
	const JWT_REFRESH_TOKEN = process.env.REFRESH_TOKEN_SECRET as string;

	if (!email || !password) {
		return res.status(400).json({ message: "All fields are required." });
	}

	const [user] = await dbConn
		.select()
		.from(users)
		.where(eq(users.email, email));

	if (!user || !user.active) {
		return res.status(401).json({ message: "Unauthorized." });
	}

	const userPassword = user?.password_hash ?? "";

	const match = await bcrypt.compare(password, userPassword);

	if (!match) {
		return res.status(401).json({ message: "Unauthorized." });
	}

	const accessToken = jwt.sign(
		{ userInfo: { id: user.id, role: user.roles }, tv: user.token_version },
		JWT_ACCESS_SECRET,
		{ algorithm: "HS256", expiresIn: "15m" }
	);

	/** generate access refresh token  */
	// "keep me signed in": 30 day persistent cookie.
	// Otherwise a session cookie (cleared when the browser closes), capped at 1 day.
	const refreshToken = jwt.sign({ id: user.id, tv: user.token_version }, JWT_REFRESH_TOKEN, {
		expiresIn: keepSignedIn ? "30d" : "1d",
	});

	res.cookie("jwt", refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production",
		...(keepSignedIn ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
	});

	res.json({ accessToken });
};

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = async (req: Request, res: Response) => {
	const cookies = req.cookies;

	if (!cookies.jwt) {
		return res.status(401).json({ message: "Unauthorized." });
	}

	const refreshToken = cookies.jwt;

	let decoded: RefreshPayload;
	try {
		decoded = jwt.verify(
			refreshToken,
			process.env.REFRESH_TOKEN_SECRET as string
		) as RefreshPayload;
	} catch (err) {
		// expired or tampered refresh token
		return res.status(403).json({ message: "Unauthorized." });
	}

	const [user] = await dbConn
		.select()
		.from(users)
		.where(eq(users.id, decoded.id));

	// disabled account, or session revoked (deactivation / password reset)
	if (!user || !user.active || user.token_version !== decoded.tv) {
		return res.status(403).json({ message: "Unauthorized." });
	}

	const accessToken = jwt.sign(
		{
			userInfo: {
				id: user.id,
				role: user.roles,
			},
			tv: user.token_version,
		},
		process.env.ACCESS_TOKEN_SECRET as string,
		{ algorithm: "HS256", expiresIn: "15m" }
	);

	return res.json({ accessToken });
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = async (req: Request, res: Response) => {
	const cookies = req.cookies;
	if (!cookies.jwt) return res.sendStatus(204);
	res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
	res.json({ message: "Cookies cleared" });
};

// @desc Set a new password with an emailed reset token
// @route POST /auth/reset-password
// @access Public - authorized by the single-use token
const resetPassword = async (req: Request, res: Response) => {
	const { token, newPassword } = req.body;

	const ok = await consumeResetToken(token, newPassword);

	if (!ok) {
		return res
			.status(400)
			.json({ message: "This reset link is invalid or has expired." });
	}

	res.json({ message: "Password updated." });
};

export { login, refresh, logout, resetPassword };
