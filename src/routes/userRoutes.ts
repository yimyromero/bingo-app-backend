import express from "express";
import * as usersController from "@/controllers/usersController.ts";

const userRouter = express.Router();

userRouter
	.route("/")
	.get(usersController.getAllUsers)
	.post(usersController.createNewUser);

export { userRouter };
