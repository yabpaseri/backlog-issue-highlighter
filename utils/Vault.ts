export const Vault = {
	debug: storage.defineItem<boolean>('local:debug', {
		fallback: false,
		version: 1,
	}),
} as const;
