import type {
	ErrorRequestHandler,
	Request,
	Response,
	NextFunction,
} from "express";
import { getDbErrorMessage } from "./dbErrorUtils.ts";

export const errorHandler: ErrorRequestHandler = (
	err: unknown,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const mapped = getDbErrorMessage(err);

	if (mapped) {
		return res.json({
			message: mapped.message,
			constraint: mapped.constraint,
			detail: mapped.detail,
		});
	}

	return res.status(500).json({
		status: "error",
		message: err,
	});
};
