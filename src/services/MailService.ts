import nodemailer from "nodemailer";

export class MailNotConfiguredError extends Error {
	constructor() {
		super("Email is not configured on the server.");
	}
}

// SMTP settings come from the environment (see .env.example)
const getTransport = () => {
	const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, MAIL_FROM } =
		process.env;

	if (!SMTP_HOST || !MAIL_FROM) {
		throw new MailNotConfiguredError();
	}

	return {
		from: MAIL_FROM,
		transport: nodemailer.createTransport({
			host: SMTP_HOST,
			port: Number(SMTP_PORT) || 587,
			secure: SMTP_SECURE === "true",
			auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
		}),
	};
};

export const sendPasswordResetEmail = async (
	to: string,
	name: string | null,
	resetLink: string,
	validMinutes: number
) => {
	const { from, transport } = getTransport();
	const greeting = name ? `Hi ${name},` : "Hi,";

	await transport.sendMail({
		from,
		to,
		subject: "Reset your Bingo password",
		text: `${greeting}\n\nAn administrator requested a password reset for your account. Use the link below to choose a new password. It can be used once and expires in ${validMinutes} minutes.\n\n${resetLink}\n\nIf you weren't expecting this, you can ignore this email.`,
	});
};
