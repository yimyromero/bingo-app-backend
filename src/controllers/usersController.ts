import { dbConn } from "@/config/dbConn.ts";
import { users } from "@/models/users.ts";
import { and, eq, getTableColumns, sql } from "drizzle-orm";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import type { AuthRequest } from "@/middleware/verifyJWT.ts";
import { logAudit } from "@/services/AuditService.ts";
import {
	RESET_TOKEN_TTL_MINUTES,
	createResetToken,
	deleteResetToken,
} from "@/services/PasswordResetService.ts";
import {
	MailNotConfiguredError,
	sendPasswordResetEmail,
} from "@/services/MailService.ts";

// @desc Get all users
// @route GET /users
const getAllUsers = async (req: Request, res: Response) => {
	const { password_hash, ...rest } = getTableColumns(users);

	const result = await dbConn.select({ ...rest }).from(users);

	res.json({ data: result });
};

// @desc Insert a user
// @route POST /users
const createNewUser = async (req: Request, res: Response) => {
	const { email, password_hash, name, roles } = req.body;

	if (!email || !password_hash) {
		return res.status(400).json({ message: "All fields are required." });
	}

	const hashedPwd = await bcrypt.hash(password_hash, 10);

	const [created] = await dbConn
		.insert(users)
		.values({
			email: email,
			password_hash: hashedPwd,
			name: name,
		})
		.returning();

	return res.status(201).json({ data: created });
};

// @desc Update a user
// @route PATCH /users
const updateUser = async (req: Request, res: Response) => {
	const { id, email, password_hash, name, roles } = req.body;

	// check fields are in the body
	if (!id || !email || !name || !roles) {
		return res.status(400).json({ message: "All fields are required." });
	}

	const [user] = await dbConn.select().from(users).where(eq(users.id, id));

	if (!user) {
		return res.status(400).json({ message: "User doesn't exist." });
	}

	//user.id = id;
	user.email = email;
	user.name = name;
	user.roles = roles;

	if (password_hash) {
		user.password_hash = await bcrypt.hash(password_hash, 10);
	}

	const [updatedUserEmail]: { email: string }[] = await dbConn
		.update(users)
		.set({
			email: user.email,
			password_hash: user.password_hash,
			name: user.name,
			roles: user.roles,
		})
		.where(eq(users.id, id))
		.returning({ email: users.email });

	if (updatedUserEmail) {
		res.json({ message: `${email} updated.` });
	}
};

// @desc Update a user
// @route DELETE/users
const deleteUser = async (req: Request, res: Response) => {
	const { id } = req.body;

	if (!id) {
		return res.status(400).json({ message: "User Id required." });
	}

	const [deletedUserId]: { deletedId: number }[] = await dbConn
		.delete(users)
		.where(eq(users.id, id))
		.returning({ deletedId: users.id });

	if (!deletedUserId) {
		return res.status(400).json({ message: `User id:${id} doesn't exist.` });
	}

	res.json({ message: `User ${deletedUserId.deletedId} deleted.` });
};

// @desc Activate or deactivate a user (admin only)
// @route PATCH /users/:id/status
const updateUserStatus = async (req: AuthRequest, res: Response) => {
	const adminId = Number(req.user?.id);
	const targetId = Number(req.params.id);
	const { active } = req.body as { active: boolean };

	if (!active && targetId === adminId) {
		return res
			.status(400)
			.json({ message: "You can't deactivate your own account." });
	}

	const result = await dbConn.transaction(async (tx) => {
		// lock the active admins so two concurrent requests can't remove them all
		const activeAdmins = await tx
			.select({ id: users.id })
			.from(users)
			.where(and(eq(users.roles, "admin"), eq(users.active, true)))
			.for("update");

		const [target] = await tx
			.select({
				id: users.id,
				roles: users.roles,
				active: users.active,
			})
			.from(users)
			.where(eq(users.id, targetId));

		if (!target) return { status: 404, message: "User doesn't exist." };

		if (target.active === active) {
			return {
				status: 409,
				message: `User is already ${active ? "active" : "disabled"}.`,
			};
		}

		if (
			!active &&
			target.roles === "admin" &&
			activeAdmins.every((admin) => admin.id === target.id)
		) {
			return {
				status: 409,
				message: "You can't deactivate the last active administrator.",
			};
		}

		// deactivating also bumps the token version to revoke every session
		await tx
			.update(users)
			.set(
				active
					? { active: true }
					: { active: false, token_version: sql`${users.token_version} + 1` }
			)
			.where(eq(users.id, targetId));

		await logAudit(tx, {
			adminId,
			targetUserId: targetId,
			action: active ? "account_activated" : "account_deactivated",
		});

		return { status: 200, message: `User ${active ? "activated" : "deactivated"}.` };
	});

	if (result.status !== 200) {
		return res.status(result.status).json({ message: result.message });
	}

	res.json({ message: result.message, data: { id: targetId, active } });
};

// @desc Email a password reset link to a user (admin only)
// @route POST /users/:id/password-reset
const sendPasswordReset = async (req: AuthRequest, res: Response) => {
	const adminId = Number(req.user?.id);
	const targetId = Number(req.params.id);

	const [target] = await dbConn
		.select({ id: users.id, email: users.email, name: users.name })
		.from(users)
		.where(eq(users.id, targetId));

	if (!target) {
		return res.status(404).json({ message: "User doesn't exist." });
	}

	// replaces any previous token for this user
	const { token, rowId } = await createResetToken(target.id);

	const frontendUrl = (
		process.env.FRONTEND_URL || "http://localhost:5173"
	).replace(/\/$/, "");
	const resetLink = `${frontendUrl}/reset-password?token=${token}`;

	try {
		await sendPasswordResetEmail(
			target.email,
			target.name,
			resetLink,
			RESET_TOKEN_TTL_MINUTES
		);
	} catch (err) {
		// the email never went out, so don't leave a usable token behind
		await deleteResetToken(rowId);

		if (err instanceof MailNotConfiguredError) {
			return res.status(503).json({ message: err.message });
		}
		// only log the error type, the message could echo the link
		console.error("Password reset email failed:", (err as Error)?.name);
		return res
			.status(502)
			.json({ message: "The reset email could not be sent." });
	}

	await logAudit(dbConn, {
		adminId,
		targetUserId: target.id,
		action: "password_reset_requested",
	});

	res.json({ message: `Password reset email sent to ${target.email}.` });
};

export {
	getAllUsers,
	createNewUser,
	updateUser,
	deleteUser,
	updateUserStatus,
	sendPasswordReset,
};
