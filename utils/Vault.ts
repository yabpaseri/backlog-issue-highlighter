export const Vault = {
	debug: storage.defineItem<boolean>('local:debug', {
		fallback: false,
		version: 1,
	}),
	highlight_enabled: storage.defineItem<boolean>('local:highlight_enabled', {
		fallback: true,
		version: 1,
	}),
	update_details_enabled: storage.defineItem<boolean>('local:update_details_enabled', {
		fallback: true,
		version: 1,
	}),
} as const;
