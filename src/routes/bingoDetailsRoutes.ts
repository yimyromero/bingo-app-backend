import express from "express";
import * as bingoDetailsController from "@/controllers/bingoDetailsController.ts";
import { validate } from "@/middleware/validate.ts";
import {
	createBingoDetailsSchema,
	updateBingoDetailsSchema,
} from "@/schemas/bingoSchema.ts";
const bingoDetailsRouter = express.Router({ mergeParams: true });

bingoDetailsRouter
	.route("/")
	.get(bingoDetailsController.getBingoDetailsById)
	.post(
		validate(createBingoDetailsSchema),
		bingoDetailsController.createBingoDetailsById
	)
	.patch(
		validate(updateBingoDetailsSchema),
		bingoDetailsController.updateBingoDetailsById
	);

export { bingoDetailsRouter };
