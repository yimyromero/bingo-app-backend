export const allowedOrigins = process.env.NODE_ENV
	? [""]
	: ["http://localhost:5173","http://localhost:5174", "http://192.168.1.161:5173"];
