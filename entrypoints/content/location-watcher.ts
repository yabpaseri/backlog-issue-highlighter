// Inspired by wxt/dist/utils/internal/custom-events(.mjs|.d.ts)
export class LocationChangeEvent extends Event {
	public static readonly EVENT_NAME = `${browser.runtime.id}:${import.meta.env.ENTRYPOINT}:locationchange`;
	constructor(
		public readonly newUrl: URL,
		public readonly oldUrl: URL,
	) {
		super(LocationChangeEvent.EVENT_NAME, {});
	}
}

// Inspired by wxt/dist/utils/internal/location-watcher(.mjs|.d.ts)
export function createLocationWatcher(ctx: InstanceType<typeof ContentScriptContext>) {
	let request: number | undefined;
	let oldUrl: URL;
	function update() {
		const newUrl = new URL(location.href);
		if (newUrl.href !== oldUrl.href) {
			window.dispatchEvent(new LocationChangeEvent(newUrl, oldUrl));
			oldUrl = newUrl;
		}
		request = ctx.requestAnimationFrame(update);
	}
	return {
		run() {
			if (request != null) return;
			oldUrl = new URL(location.href);
			request = ctx.requestAnimationFrame(update);
		},
	};
}
