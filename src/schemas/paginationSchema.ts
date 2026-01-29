import { z } from "zod";

export const paginationSchema = z.object({
	offset: z
		.string()
		.optional()
		.transform(Number)
		.refine((n) => Number.isInteger(n) && n >= 0, {
			message: "offset must be a non-negative integer.",
		})
		.default(0),

	limit: z
		.string()
		.optional()
		.transform(Number)
		.refine((n) => Number.isInteger(n) && n > 0 && n <= 100, {
			message: "limit must be between 1 and 100.",
		})
		.default(50),
});

export type Pagination = z.infer<typeof paginationSchema>;
