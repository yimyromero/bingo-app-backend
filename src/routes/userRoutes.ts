import express from "express";
import * as usersController from "@/controllers/usersController.ts";
import { validate } from "@/middleware/validate.ts";
import { userRegistrationSchema } from "@/schemas/userSchemas.ts";
import {
	updateUserStatusSchema,
	userIdSchema,
} from "@/schemas/userAdminSchemas.ts";
import { verifyJWT } from "@/middleware/verifyJWT.ts";
import { verifyIsAdmin } from "@/middleware/verifyIsAdmin.ts";

const userRouter = express.Router();

userRouter.use(verifyJWT);
userRouter.use(verifyIsAdmin);

userRouter
	.route("/")
	.get(usersController.getAllUsers)
	.post(validate(userRegistrationSchema), usersController.createNewUser)
	.patch(usersController.updateUser)
	.delete(usersController.deleteUser);

userRouter
	.route("/:id/status")
	.patch(validate(updateUserStatusSchema), usersController.updateUserStatus);

userRouter
	.route("/:id/password-reset")
	.post(validate(userIdSchema), usersController.sendPasswordReset);

export { userRouter };
