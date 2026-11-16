import express from "express";
import * as authController from "@/controllers/authController.tsx";
import { validate } from "@/middleware/validate.ts";
import { resetPasswordLimiter } from "@/middleware/limiter.ts";
import { resetPasswordSchema } from "@/schemas/userAdminSchemas.ts";

const authRouter = express.Router();

authRouter.route("/").post(authController.login);
authRouter.route("/refresh").get(authController.refresh);
authRouter.route("/logout").post(authController.logout);
authRouter
	.route("/reset-password")
	.post(
		resetPasswordLimiter,
		validate(resetPasswordSchema),
		authController.resetPassword
	);

export { authRouter };
