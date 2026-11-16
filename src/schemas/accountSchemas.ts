import { z } from "zod";

// letters (any language), spaces, apostrophes, periods and hyphens
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} '.-]*$/u;

// bcrypt only uses the first 72 bytes of a password
const maxBytes = (s: string) => Buffer.byteLength(s) <= 72;

export const updateAccountSchema = z.object({
	body: z.strictObject({
		name: z.string().trim().min(1).max(50).regex(NAME_PATTERN),
		email: z.string().trim().max(255).pipe(z.email()),
	}),
});

export const changePasswordSchema = z.object({
	body: z
		.strictObject({
			currentPassword: z.string().min(1),
			newPassword: z.string().min(8).refine(maxBytes),
			confirmPassword: z.string(),
		})
		.refine((d) => d.newPassword === d.confirmPassword, {
			path: ["confirmPassword"],
			message: "Passwords do not match.",
		})
		.refine((d) => d.newPassword !== d.currentPassword, {
			path: ["newPassword"],
			message: "The new password must be different.",
		}),
});
