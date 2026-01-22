import { dbConn } from "@/config/dbConn.ts";
import { users } from "@/models/users.ts";
import { getTableColumns } from "drizzle-orm";
import type { Request, Response } from "express";
import { z } from "zod";
import { userRegistrationSchema } from "@/schemas/userSchemas.ts";
import { validateRoute } from "@/middleware/validate.ts";

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
	const { query, body, headers, params } = validateRoute({
		schema: {
			querySchema: z.object({}),
			bodySchema: userRegistrationSchema,
			paramsSchema: z.object({}),
			headerSchema: z.object({}),
		},
		req,
	});

	// use validated `body` to create the user (placeholder response)
	res.status(201).json({ user: body });
};

export { getAllUsers, createNewUser };
