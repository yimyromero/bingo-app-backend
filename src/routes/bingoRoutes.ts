import express from "express";
import * as bingosController from "@/controllers/bingosController.ts";

const bingoRouter = express.Router();

bingoRouter.route("/").get(bingosController.getAllBingos);

export { bingoRouter };
