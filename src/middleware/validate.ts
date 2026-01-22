import type { NextFunction, Request, Response } from "express";
import { z, ZodError, ZodObject } from "zod";
import { ZodIssueCode } from "zod/v3";

export type Schema<
	Query extends ZodObject,
	Body extends ZodObject,
	Params extends ZodObject,
	Headers extends ZodObject
> = {
	querySchema: Query;
	bodySchema: Body;
	paramsSchema: Params;
	headerSchema: Headers;
};

type parseWithSchemaType<Schema extends ZodObject> = {
	data: unknown;
	schema: Schema;
	errorMessage?: string;
};

const parseWithSchema = <Schema extends ZodObject>({
	data,
	schema,
	errorMessage,
}: parseWithSchemaType<Schema>) => {
	return schema.parse(data, {
		error: (iss) => {
			if (iss.code === ZodIssueCode.unrecognized_keys && errorMessage) {
				return { message: errorMessage };
			}
			return undefined;
		},
	}) as z.infer<Schema>;
};

type Props<
	Query extends ZodObject,
	Body extends ZodObject,
	Params extends ZodObject,
	Headers extends ZodObject
> = {
	schema: Schema<Query, Body, Params, Headers>;
	req: Request;
};

export const validateRoute = <
	Query extends ZodObject,
	Body extends ZodObject,
	Params extends ZodObject,
	Headers extends ZodObject
>({
	schema,
	req,
}: Props<Query, Body, Params, Headers>) => {
	const { querySchema, bodySchema, paramsSchema, headerSchema } = schema;
	const query = parseWithSchema({
		data: req.query,
		schema: querySchema,
		errorMessage: "Unrecognized query parameters",
	});

	const body = parseWithSchema({
		data: req.body,
		schema: bodySchema,
		errorMessage: "Unrecognized body content",
	});

	const params = parseWithSchema({
		data: req.params,
		schema: paramsSchema,
		errorMessage: "Unrecognized parameter values",
	});

	const headers = parseWithSchema({
		data: req.headers,
		schema: headerSchema,
		errorMessage: "Unrecognized headers",
	});

	return { query, body, params, headers };
};
