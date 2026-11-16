import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcrypt";
import { dbConn } from "@/config/dbConn.ts";
import { passwordResetTokens } from "@/models/passwordResetTokens.ts";
import { users } from "@/models/users.ts";

export const RESET_TOKEN_TTL_MINUTES = 60;

const hashToken = (token: string) =>
	createHash("sha256").update(token).digest("hex");

/**
 * Create a reset token for a user. Any earlier token is invalidated.
 * Returns the raw token (to be emailed) and the id of the stored row.
 */
export const createResetToken = async (userId: number) => {
	// 32 random bytes: high entropy, so a plain SHA-256 hash is enough to store
	const token = randomBytes(32).toString("hex");
	const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

	const rowId = await dbConn.transaction(async (tx) => {
		await tx
			.delete(passwordResetTokens)
			.where(eq(passwordResetTokens.userId, userId));

		const [row] = await tx
			.insert(passwordResetTokens)
			.values({ userId, tokenHash: hashToken(token), expiresAt })
			.returning({ id: passwordResetTokens.id });

		return row!.id;
	});

	return { token, rowId };
};

export const deleteResetToken = async (rowId: number) => {
	await dbConn
		.delete(passwordResetTokens)
		.where(eq(passwordResetTokens.id, rowId));
};

/**
 * Use a reset token to set a new password.
 * The token is consumed atomically (single use) and every existing session
 * is revoked. The account's active flag is left untouched.
 * Returns false when the token is unknown or expired.
 */
export const consumeResetToken = async (
	token: string,
	newPassword: string
): Promise<boolean> => {
	const hashedPwd = await bcrypt.hash(newPassword, 10);

	return await dbConn.transaction(async (tx) => {
		const [used] = await tx
			.delete(passwordResetTokens)
			.where(
				and(
					eq(passwordResetTokens.tokenHash, hashToken(token)),
					gt(passwordResetTokens.expiresAt, new Date())
				)
			)
			.returning({ userId: passwordResetTokens.userId });

		if (!used) return false;

		const [user] = await tx
			.select({ tokenVersion: users.token_version })
			.from(users)
			.where(eq(users.id, used.userId));

		await tx
			.update(users)
			.set({
				password_hash: hashedPwd,
				token_version: (user?.tokenVersion ?? 0) + 1,
			})
			.where(eq(users.id, used.userId));

		return true;
	});
};
