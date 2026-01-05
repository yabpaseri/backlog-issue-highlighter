export type Audit = {
	key: string;
	at: string; // ISO 8601 format
	by: string;
};

export type AuditView = {
	at: string; // Backlog display format
	by: string;
};
