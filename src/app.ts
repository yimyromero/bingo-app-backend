import express from "express";
import { getDirname } from "./utils/utils.js";
import path from "path";

const __dirname = getDirname(import.meta.url);

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
	res.json({ message: "Hello World!" });
});

app.all("/*splat", (req, res) => {
	res.status(404);
	if (req.accepts("html")) {
		res.sendFile(path.join(__dirname, "views", "404.html"));
	} else if (req.accepts("json")) {
		res.json({ message: `404 Not found` });
	} else {
		res.type("txt").send("404 Not found");
	}
});

export default app;
