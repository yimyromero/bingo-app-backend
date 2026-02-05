import { fileURLToPath } from "url";
import { dirname } from "path";

export const getDirname = (metaURL: string): string => {
	return dirname(fileURLToPath(metaURL));
};

export const isArrayEmpty = (arr: []) => {
	return Array.isArray(arr) && arr.length === 0;
};
