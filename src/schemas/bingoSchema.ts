import { boolean, number, z } from "zod";

export const createBingoSchema = z.object({
	body: z.object({
		userId: z.number(),
		title: z.string(),
		gridSize: z
			.transform(Number)
			.refine((n) => Number.isInteger(n) && n > 0 && n <= 100, {
				message: "grid size must be between 1 and 100.",
			})
			.default(25),
		raffleDate: z.iso.datetime().optional(),
		isDone: boolean().optional(),
	}),
});

export const updateBingoSchema = z.object({
	body: z.object({
		id: z.number(),
		userId: z.number(),
		title: z.string(),
		gridSize: z
			.transform(Number)
			.refine((n) => Number.isInteger(n) && n > 0 && n <= 100, {
				message: "grid size must be between 1 and 100.",
			}),
		raffleDate: z.iso.datetime().optional(),
		isDone: boolean().optional(),
	}),
});

export const createBingoDetailsSchema = z.object({
	body: z.object({
		details: z
			.array(
				z.object({
					cellNumber: z.number().int().positive(),
					participantName: z.string(),
				})
			)
			.min(1),
	}),
});

export const updateBingoDetailsSchema = z.object({
	body: z.object({
		details: z.array(
			z.object({
				cellNumber: z.number().int().positive(),
				participantName: z.string().nullable(),
			})
		),
	}),
});

const bingoDetailInputSchema =
	updateBingoDetailsSchema.shape.body.shape.details.element;
export type BingoDetailInput = z.infer<typeof bingoDetailInputSchema>;
