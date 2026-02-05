import express from "express";
import * as bingosController from "@/controllers/bingosController.ts";
import { validate } from "@/middleware/validate.ts";
import { createBingoSchema, updateBingoSchema } from "@/schemas/bingoSchema.ts";
import { bingoDetailsRouter } from "./bingoDetailsRoutes.ts";

const bingoRouter = express.Router();

bingoRouter
	.route("/")
	.get(bingosController.getAllBingos)
	.post(validate(createBingoSchema), bingosController.createNewBingo)
	.patch(validate(updateBingoSchema), bingosController.updateBingo)
	.delete(bingosController.deleteBingo);

bingoRouter.use("/:bingoId/details", bingoDetailsRouter);

export { bingoRouter };
