import express from "express";
import * as bingosController from "@/controllers/bingosController.ts";
import { validate } from "@/middleware/validate.ts";
import { createBingoSchema, updateBingoSchema } from "@/schemas/bingoSchema.ts";

const bingoRouter = express.Router();

bingoRouter
	.route("/")
	.get(bingosController.getAllBingos)
	.post(validate(createBingoSchema), bingosController.createNewBingo)
	.patch(validate(updateBingoSchema), bingosController.updateBingo)
	.delete(bingosController.deleteBingo);

export { bingoRouter };
