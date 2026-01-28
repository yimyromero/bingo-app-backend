import express from "express";
import * as usersController from "@/controllers/usersController.ts";
import { validate } from "@/middleware/validate.ts";
import { userRegistrationSchema } from "@/schemas/userSchemas.ts";

const userRouter = express.Router();

userRouter
	.route("/")
	.get(usersController.getAllUsers)
	.post(validate(userRegistrationSchema), usersController.createNewUser)
	.patch(usersController.updateUser)
	.delete(usersController.deleteUser);

export { userRouter };
