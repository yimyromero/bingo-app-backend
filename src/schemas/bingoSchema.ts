import { title } from "node:process";
import { boolean, z } from "zod";

export const createBingoSchema = z.object({
	body: z.object({
		userId: z.number(),
		title: z.string(),
		gridSize: z
			.string()
			.optional()
			.transform(Number)
			.refine((n) => Number.isInteger(n) && n > 0 && n <= 100, {
				message: "grid size must be between 1 and 100.",
			})
			.default(25),
		raffleDate: z.iso.datetime().optional(),
		isDone: boolean().optional(),
	}),
});
