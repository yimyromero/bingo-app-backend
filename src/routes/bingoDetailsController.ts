import express from "express";
import * as bingoDetailsController from "@/controllers/bingoDetailsController.ts";
const bingoDetailsRouter = express.Router();

bingoDetailsRouter.route("/").get(bingoDetailsController.getBingoDetailsById);

export { bingoDetailsRouter };
