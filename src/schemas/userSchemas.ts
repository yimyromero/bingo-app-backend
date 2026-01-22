import { z } from "zod";

export const userRegistrationSchema = z.object({
	email: z.email(),
	password_hash: z.string().min(8),
	name: z.string(),
});
