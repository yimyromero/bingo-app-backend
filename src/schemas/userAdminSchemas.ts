import { z } from "zod";

const userIdParams = z.object({
	id: z.string().regex(/^[1-9]\d*$/),
});

export const userIdSchema = z.object({
	params: userIdParams,
});

export const updateUserStatusSchema = z.object({
	params: userIdParams,
	body: z.strictObject({
		active: z.boolean(),
	}),
});

export const resetPasswordSchema = z.object({
	body: z
		.strictObject({
			token: z.string().regex(/^[a-f0-9]{64}$/),
			newPassword: z
				.string()
				.min(8)
				// bcrypt only uses the first 72 bytes
				.refine((s) => Buffer.byteLength(s) <= 72),
			confirmPassword: z.string(),
		})
		.refine((d) => d.newPassword === d.confirmPassword, {
			path: ["confirmPassword"],
			message: "Passwords do not match.",
		}),
});
