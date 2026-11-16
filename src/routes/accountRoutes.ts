import express from "express";
import * as accountController from "@/controllers/accountController.ts";
import { validate } from "@/middleware/validate.ts";
import { verifyJWT } from "@/middleware/verifyJWT.ts";
import {
	changePasswordSchema,
	updateAccountSchema,
} from "@/schemas/accountSchemas.ts";

const accountRouter = express.Router();

// every route acts on the authenticated user only
accountRouter.use(verifyJWT);

accountRouter
	.route("/")
	.get(accountController.getAccount)
	.patch(validate(updateAccountSchema), accountController.updateAccount);

accountRouter
	.route("/password")
	.patch(validate(changePasswordSchema), accountController.changePassword);

export { accountRouter };
