import express from "express";
import * as bingosController from "@/controllers/bingosController.ts";
import { validate } from "@/middleware/validate.ts";
import { requireBingoAccess } from "@/middleware/requireBingoAccess.ts";
import { verifyJWT } from "@/middleware/verifyJWT.ts";
import {
	createBingoSchema,
	updateBingoDetailCellSchema,
	updateBingoSchema,
} from "@/schemas/bingoSchema.ts";
import { bingoDetailsRouter } from "./bingoDetailsRoutes.ts";
import { updateBingoDetailCell } from "@/controllers/bingoDetailsController.ts";

const bingoRouter = express.Router();

bingoRouter.use(verifyJWT);

bingoRouter.get("/summary", bingosController.getBingoSummary);

bingoRouter
	.route("/")
	.get(bingosController.getAllBingos)
	.post(validate(createBingoSchema), bingosController.createNewBingo)
	.patch(validate(updateBingoSchema), bingosController.updateBingo);

bingoRouter
	.route("/:bingoId")
	.get(bingosController.getBingoById)
	.delete(requireBingoAccess, bingosController.deleteBingo);

bingoRouter.use("/:bingoId/details", requireBingoAccess, bingoDetailsRouter);
bingoRouter.use(
	"/:bingoId/details/:detailId/cell",
	requireBingoAccess,
	validate(updateBingoDetailCellSchema),
	updateBingoDetailCell
);

export { bingoRouter };
