import bcrypt from "bcrypt";
import { dbConn } from "./dbConn.ts";
import { users } from "@/models/users.ts";
import { eq, sql } from "drizzle-orm";

async function createAdmin() {
	const email = "admin@bingo.con";
	const password = "Admin123!";
	const name = "admin_user";

	const existing = await dbConn
		.select({
			id: users.id,
			email: users.email,
		})
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	if (existing.length > 0) {
		console.log(`Admin ${email} already exists.`);
		return;
	}

	// Work around drizzle-seed sequence synchronization issue.
	await dbConn.execute(sql`
		SELECT setval(
			pg_get_serial_sequence('users', 'id'),
			COALESCE((SELECT MAX(id) FROM users), 0) + 1,
			false
		)
	`);

	const passwordHash = await bcrypt.hash(password, 10);

	const [admin] = await dbConn
		.insert(users)
		.values({
			email,
			name,
			password_hash: passwordHash,
			roles: "admin",
			active: true,
		})
		.returning({
			id: users.id,
			email: users.email,
			name: users.name,
			roles: users.roles,
		});

	console.log("Admin created:", admin);
}

createAdmin()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Failed to create admin:", error);
		process.exit(1);
	});
