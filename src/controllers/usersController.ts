import { dbConn } from "@/config/dbConn.ts";
import { users } from "@/models/users.ts";
import { eq, getTableColumns } from "drizzle-orm";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";

// @desc Get all users
// @route GET /users
const getAllUsers = async (req: Request, res: Response) => {
	const { password_hash, ...rest } = getTableColumns(users);

	const result = await dbConn.select({ ...rest }).from(users);

	res.json(result);
};
// @desc Insert a user
// @route POST /users
const createNewUser = async (req: Request, res: Response) => {
	const { email, password_hash, name, roles } = req.body;

	if (!email || !password_hash) {
		return res.status(400).json({ message: "All fields are required" });
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

	return res.status(201).json(created);
};

const updateUser = async (req: Request, res: Response) => {
	const { id, email, password_hash, name, roles, active } = req.body;

	// check fields are in the body
	if (!id || !email || !name || !roles || !active) {
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
	user.active = active;

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
			active: user.active,
		})
		.where(eq(users.id, id))
		.returning({ email: users.email });

	if (updatedUserEmail) {
		res.json({ message: `${email} updated.` });
	}
};

export { getAllUsers, createNewUser, updateUser };
