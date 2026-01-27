import { dbConn } from "@/config/dbConn.ts";
import { users } from "@/models/users.ts";
import { getTableColumns } from "drizzle-orm";
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

	//res.status(201).json({ message: "User created successfully" });
};

export { getAllUsers, createNewUser };
