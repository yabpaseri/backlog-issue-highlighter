export const defaultEnabled = storage.defineItem<boolean>('local:default_enabled', {
	version: 1,
	fallback: false,
});
