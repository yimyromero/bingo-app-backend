import { dbConn } from "@/config/dbConn.ts";
import { auditLogs } from "@/models/auditLogs.ts";

export type AuditAction =
	| "password_reset_requested"
	| "account_activated"
	| "account_deactivated";

type DbOrTx = Pick<typeof dbConn, "insert">;

// Records who did what to whom. Never pass passwords or tokens here.
export const logAudit = async (
	db: DbOrTx,
	entry: { adminId: number; targetUserId: number; action: AuditAction }
) => {
	await db.insert(auditLogs).values(entry);
};
