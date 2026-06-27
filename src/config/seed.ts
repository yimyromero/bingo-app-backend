import bcrypt from "bcrypt";
import { dbConn } from "./dbConn.ts";
import { users } from "@/models/users.ts";
import { bingoRelations, bingos } from "@/models/bingos.ts";
import { bingoDetails } from "@/models/bingo_details.ts";
import { seed } from "drizzle-seed";
import { faker } from "@faker-js/faker";

const schema = {
	users,
	bingos,
	bingoDetails,
	bingoRelations,
};

async function seedAdmin() {
	const hash = await bcrypt.hash("Admin123!", 10);

	const [admin] = await dbConn
		.insert(users)
		.values({
			email: "admin@bingo.con",
			name: "admin_user",
			password_hash: hash,
		})
		.returning();

	return admin;
}

async function seedUsersAndBingos() {
	const result = await seed(dbConn, schema).refine((funcs) => ({
		users: {
			count: 9,
			columns: {
				email: (({ index }: { index: number }) =>
					`user${index}@bingo.com`) as any,
				name: (() => faker.internet.username()) as any,
				password_hash: (() => "dev-password") as any,
			},
			with: {
				bingos: 20,
			},
		},

		bingos: {
			columns: {
				title: funcs.string(),
				gridSize: funcs.number(),
				prizes: funcs.valuesFromArray({
					values: [
						"Carteras, zapatos, mochila, perfume",
						"Crema, Perfume, Camiseta",
						"Zapatos, Flores, Peluche, Cartera",
					],
				}),
			},
		},
	}));
}

seedAdmin();
seedUsersAndBingos();
