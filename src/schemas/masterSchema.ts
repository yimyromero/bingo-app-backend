import { z } from "zod";

export type Schema = {
	querySchema: z.ZodObject;
	bodySchema: z.ZodObject;
	paramsSchema: z.ZodObject;
	headerSchema: z.ZodObject;
};
