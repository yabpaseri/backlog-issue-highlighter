import defu from 'defu';
import { ensureDir, exists } from 'fs-extra';
import { relative, resolve } from 'node:path';
import sharp from 'sharp';
import { defineWxtModule } from 'wxt/modules';

// Inspired by @wxt-dev/auto-icons/dist/index(.mjs|.d.ts)
// https://github.com/wxt-dev/wxt/blob/f9d0b64d7a5692c070f91aaec983f030e6fb6a18/packages/auto-icons/src/index.ts
export default defineWxtModule({
	name: 'auto-icons',
	configKey: 'autoIcons',
	async setup(wxt, options) {
		const parsedOptions = defu<Required<AutoIconsOptions>, AutoIconsOptions[]>(options, {
			enabled: true,
			developmentIndicator: false,
			sizes: {},
		});

		if (!parsedOptions.enabled) {
			return wxt.logger.warn(`\`[auto-icons]\` ${this.name} disabled`);
		}

		const skipped: Record<string, string> = {};
		for (const [size, baseIconPath] of Object.entries(parsedOptions.sizes)) {
			const resolvedPath = resolve(wxt.config.srcDir, baseIconPath);
			if (!(await exists(resolvedPath))) {
				delete parsedOptions.sizes[Number(size)];
				skipped[size] = relative(process.cwd(), resolvedPath);
			} else {
				parsedOptions.sizes[Number(size)] = resolvedPath;
			}
		}

		if (Object.keys(parsedOptions.sizes).length === 0) {
			if (Object.keys(skipped).length > 0) {
				let msg = `\`[auto-icons]\` Skipping icon generation, no base icon found.\n\tMissing icons:`;
				Object.entries(skipped).forEach(([size, resolvedPath]) => (msg += `\n\t - ${size}: ${resolvedPath}`));
				return wxt.logger.warn(msg);
			} else {
				return wxt.logger.warn(`\`[auto-icons]\` Skipping icon generation, size and icon are not specified.`);
			}
		}

		wxt.hooks.hook('build:manifestGenerated', async (wxt, manifest) => {
			if (manifest.icons) {
				return wxt.logger.warn('`[auto-icons]` icons property found in manifest, overwriting with auto-generated icons');
			}
			manifest.icons = Object.fromEntries(Object.keys(parsedOptions.sizes).map((size) => [size, `icons/${size}.png`]));
		});

		wxt.hooks.hook('build:done', async (wxt, output) => {
			const outputFolder = wxt.config.outDir;

			for (const [size_, resolvedPath] of Object.entries(parsedOptions.sizes)) {
				const size = Number(size_);
				const resizedImage = sharp(resolvedPath).resize(size).png();

				if (wxt.config.mode === 'development') {
					if (parsedOptions.developmentIndicator === 'grayscale') {
						resizedImage.grayscale();
					} else if (parsedOptions.developmentIndicator === 'overlay') {
						const buildDevOverlay = (size: number) => {
							const rectHeight = Math.round(size * 0.5);
							const fontSize = Math.round(size * 0.35);
							return Buffer.from(
								`<?xml version="1.0" encoding="UTF-8"?><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="${size - rectHeight}" width="${size}" height="${rectHeight}" fill="#ffff00" /><text x="${size / 2}" y="${size - rectHeight / 2}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold" fill="black" text-anchor="middle" dominant-baseline="middle">DEV</text></svg>`,
							);
						};
						const overlayBuffer = await sharp(buildDevOverlay(size)).png().toBuffer();
						resizedImage.composite([{ input: overlayBuffer, left: 0, top: 0 }]);
					}
				}

				ensureDir(resolve(outputFolder, 'icons'));
				await resizedImage.toFile(resolve(outputFolder, 'icons', `${size}.png`));
				output.publicAssets.push({
					type: 'asset',
					fileName: `icons/${size}.png`,
				});
			}
		});

		wxt.hooks.hook('prepare:publicPaths', (wxt, paths) => {
			for (const size of Object.keys(parsedOptions.sizes)) {
				paths.push(`icons/${size}.png`);
			}
		});
	},
});

export interface AutoIconsOptions {
	enabled?: boolean;
	developmentIndicator?: 'grayscale' | 'overlay' | false;
	/**
	 * key: size
	 * value: baseIconPath
	 */
	sizes: Record<number, string>;
}

declare module 'wxt' {
	export interface InlineConfig {
		autoIcons: AutoIconsOptions;
	}
}
