import express from "express";
import { getDirname } from "../utils/utils.ts";
import path from "node:path";

const __dirname = getDirname(import.meta.url);

const router = express.Router();

router.get(["/", "/index", "/index.html"], (req, res) => {
	res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

export { router };
