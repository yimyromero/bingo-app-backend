import { dbConn } from "@/config/dbConn.ts";
import { users } from "@/models/users.ts";
import { getTableColumns } from "drizzle-orm";
import type { Request, Response } from "express";

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
	const { email, password_hash, name } = req.body;
	res.status(201).json({ message: "User created successfully" });
};

export { getAllUsers, createNewUser };
