import bcrypt from "bcrypt";
import { dbConn } from "./dbConn.ts";
import { users } from "@/models/users.ts";
import { bingos } from "@/models/bingos.ts";
import { bingoDetails } from "@/models/bingo_details.ts";
import { seed } from "drizzle-seed";
import { faker } from "@faker-js/faker";
import { integer } from "drizzle-orm/gel-core";
import { sql } from "drizzle-orm";

const schema = {
	users,
	bingos,
	bingoDetails,
};

async function seedAdmin() {
	console.log(">>> seedAdmin START");
	const hash = await bcrypt.hash("Admin123!", 10);

	const [admin] = await dbConn
		.insert(users)
		.values({
			email: "admin@bingo.con",
			name: "admin_user",
			password_hash: hash,
		})
		.returning();

	console.log(">>> seedAdmin INSERT COMPLETE");

	return admin;
}

async function resetData() {
	await dbConn.execute(
		sql`TRUNCATE TABLE 
					bingo_details, 
					bingo, 
					users 
			RESTART IDENTITY CASCADE`
	);
}

async function seedUsersAndBingos() {
	console.log("Starting seed...");
	console.log("before bcrypt");
	const passwordHash = await bcrypt.hash("dev-password", 10);
	console.log("After bcrypt");
	const result = await seed(dbConn, schema).refine((funcs) => ({
		users: {
			count: 9,
			columns: {
				email: funcs.email(),
				name: funcs.firstName(),
				password_hash: funcs.default({
					defaultValue: passwordHash,
				}),
			},
			with: {
				bingos: 20,
			},
		},

		bingos: {
			columns: {
				title: funcs.valuesFromArray({
					values: [
						"Summer Splash",
						"Holiday Fun",
						"Family Night",
						"Office Party",
						"Birthday Bash",
						"Movie Night",
						"School Spirit",
						"Lucky Stars",
						"Weekend Challenge",
						"Community Event",
						"Spring Festival",
						"Winter Wonderland",
						"Game Night",
						"Charity Raffle",
						"Back to School",
						"Halloween Special",
						"Thanksgiving Feast",
						"New Year's Celebration",
						"Company Picnic",
						"Anniversary Celebration",
					],
				}),
				gridSize: funcs.int({
					minValue: 10,
					maxValue: 50,
				}),
				prizes: funcs.valuesFromArray({
					values: [
						"Carteras, zapatos, mochila, perfume",
						"Crema, Perfume, Camiseta",
						"Zapatos, Flores, Peluche, Cartera",
					],
				}),
			},
		},
		bingoDetails: {
			count: 0,
		},
	}));

	const NAME_PROBABILITY = 0.7;

	const bingosResults = await dbConn
		.select({
			id: bingos.id,
			gridSize: bingos.gridSize,
		})
		.from(bingos);

	const bingoDetailsToInsert = bingosResults.flatMap((bingo) =>
		Array.from({ length: bingo.gridSize }, (_, index) => ({
			bingoId: bingo.id,
			cellNumber: index + 1,
			participantName:
				Math.random() > NAME_PROBABILITY ? faker.person.fullName() : null,
		}))
	);

	await dbConn.insert(bingoDetails).values(bingoDetailsToInsert);
	console.log(`Created ${bingoDetailsToInsert.length} bingo cells`);

	console.log("Seed result:", result);
}

async function main() {
	try {
		await resetData();
		//await seedAdmin();
		await seedUsersAndBingos();

		console.log("Seeding completed");
	} catch (error) {
		console.error("Seeding failed:", error);
		process.exit(1);
	}
}

main();
