import express from "express";
import * as authController from "@/controllers/authController.tsx";

const authRouter = express.Router();

authRouter.route("/").post(authController.login);
authRouter.route("/refresh").get(authController.refresh);
authRouter.route("/logout").post(authController.logout);

export { authRouter };
