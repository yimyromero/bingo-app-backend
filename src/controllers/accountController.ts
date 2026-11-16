import { dbConn } from "@/config/dbConn.ts";
import { users } from "@/models/users.ts";
import type { AuthRequest } from "@/middleware/verifyJWT.ts";
import { updateAccountSchema } from "@/schemas/accountSchemas.ts";
import bcrypt from "bcrypt";
import { and, eq, ne, sql, DrizzleQueryError } from "drizzle-orm";
import type { Response } from "express";
import { DatabaseError } from "pg";

// never select password_hash for responses
const publicColumns = {
	id: users.id,
	email: users.email,
	name: users.name,
	active: users.active,
};

const EMAIL_IN_USE = { message: "That email address is already in use." };

const isUniqueViolation = (err: unknown) =>
	err instanceof DrizzleQueryError &&
	err.cause instanceof DatabaseError &&
	err.cause.code === "23505";

/**
 * Get the authenticated user's profile
 * @route GET /account
 */
const getAccount = async (req: AuthRequest, res: Response) => {
	// identity always comes from the verified token, never from the client
	const userId = Number(req.user?.id);

	const [account] = await dbConn
		.select(publicColumns)
		.from(users)
		.where(eq(users.id, userId));

	if (!account) {
		return res.status(404).json({ message: "Account not found." });
	}

	res.json({ data: account });
};

/**
 * Update the authenticated user's name and email.
 * `active` and `roles` can't be changed here.
 * @route PATCH /account
 */
const updateAccount = async (req: AuthRequest, res: Response) => {
	const userId = Number(req.user?.id);
	const { name, email } = updateAccountSchema.shape.body.parse(req.body);

	const [current] = await dbConn
		.select({ active: users.active })
		.from(users)
		.where(eq(users.id, userId));

	if (!current) {
		return res.status(404).json({ message: "Account not found." });
	}
	if (!current.active) {
		return res.status(403).json({ message: "Account is disabled." });
	}

	// case-insensitive duplicate check, excluding the user's own record
	const [duplicate] = await dbConn
		.select({ id: users.id })
		.from(users)
		.where(
			and(sql`lower(${users.email}) = lower(${email})`, ne(users.id, userId))
		);

	if (duplicate) {
		return res.status(409).json(EMAIL_IN_USE);
	}

	try {
		const [updated] = await dbConn
			.update(users)
			.set({ name, email })
			.where(eq(users.id, userId))
			.returning(publicColumns);

		return res.json({ message: "Profile updated.", data: updated });
	} catch (err) {
		// lost a race with another request that took the same email
		if (isUniqueViolation(err)) {
			return res.status(409).json(EMAIL_IN_USE);
		}
		throw err;
	}
};

/**
 * Change the authenticated user's password
 * @route PATCH /account/password
 */
const changePassword = async (req: AuthRequest, res: Response) => {
	const userId = Number(req.user?.id);
	const { currentPassword, newPassword } = req.body;

	const [user] = await dbConn.select().from(users).where(eq(users.id, userId));

	if (!user) {
		return res.status(404).json({ message: "Account not found." });
	}
	if (!user.active) {
		return res.status(403).json({ message: "Account is disabled." });
	}

	const match = await bcrypt.compare(currentPassword, user.password_hash);

	// 400 (not 401/403) so the client doesn't treat it as an expired session
	if (!match) {
		return res.status(400).json({ message: "Current password is incorrect." });
	}

	const hashedPwd = await bcrypt.hash(newPassword, 10);

	await dbConn
		.update(users)
		.set({ password_hash: hashedPwd })
		.where(eq(users.id, userId));

	res.json({ message: "Password updated." });
};

export { getAccount, updateAccount, changePassword };
