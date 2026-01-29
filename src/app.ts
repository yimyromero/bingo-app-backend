import express from "express";
import { getDirname } from "./utils/utils.js";
import { router } from "./routes/root.ts";
import cookieParser from "cookie-parser";
import path from "path";
import { bingos } from "./models/bingos.ts";
import { dbConn } from "./config/dbConn.ts";
import morgan from "morgan";
import { rateLimiter } from "./middleware/limiter.ts";
import bodyParser from "body-parser";

import { userRouter } from "./routes/userRoutes.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { bingoRouter } from "./routes/bingoRoutes.ts";

const __dirname = getDirname(import.meta.url);

const app = express();

app.use(bodyParser.json());
// logger
app.use(morgan("dev"));

// limiter
app.use(rateLimiter);

//cors

app.use(express.json());

// cookie parser
app.use(cookieParser());

app.use("/", express.static(path.join(__dirname, "public")));

app.get("/", router);

app.use("/users", userRouter);
app.use("/bingos", bingoRouter);

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

app.use(errorHandler);

export default app;
