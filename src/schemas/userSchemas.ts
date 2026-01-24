import { z } from "zod";

export const userRegistrationSchema = z.object({
	body: z.object({
		email: z.email(),
		password_hash: z.string().min(8),
		name: z
			.string()
			.regex(/^[a-z0-9_]+$/)
			.min(5)
			.max(20),
	}),
});
