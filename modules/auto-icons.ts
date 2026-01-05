import 'wxt';
import { defineWxtModule } from 'wxt/modules';

import defu from 'defu';
import { ensureDir, exists } from 'fs-extra';
import { relative, resolve } from 'node:path';
import sharp from 'sharp';

export default defineWxtModule({
	name: 'auto-icons',
	configKey: 'autoIcons',
	async setup(wxt, options) {
		const parsedOptions = defu<Required<AutoIconsOptions>, AutoIconsOptions[]>(options, {
			enabled: true,
			sizes: {},
		});

		if (!parsedOptions.enabled) {
			return wxt.logger.warn(`\`[auto-icons]\` ${this.name} disabled`);
		}
		if (Object.keys(parsedOptions.sizes).length === 0) {
			return wxt.logger.warn(`\`[auto-icons]\` No icon sizes specified, skipping icon generation`);
		}

		const resolvedPaths = new Map<number, string>();
		const rejectedPaths = new Map<number, string>();
		for (const [size, path] of Object.entries(parsedOptions.sizes)) {
			const resovedPath = resolve(wxt.config.srcDir, path);
			if (await exists(resovedPath)) {
				resolvedPaths.set(Number(size), resovedPath);
			} else {
				rejectedPaths.set(Number(size), resovedPath);
			}
		}

		if (rejectedPaths.size > 0) {
			const list = [...rejectedPaths.entries()].map(([size, path]) => ` - ${size}: ${relative(wxt.config.srcDir, path)}`).join('\n');
			if (resolvedPaths.size === 0) {
				return wxt.logger.warn(`\`[auto-icons]\` No valid icon source paths found, skipping icon generation:\n${list}`);
			} else {
				wxt.logger.warn(`\`[auto-icons]\` Some icon source paths were not found and will be skipped:\n${list}`);
			}
		}

		wxt.hooks.hook('build:manifestGenerated', async (wxt, manifest) => {
			if (manifest.icons) {
				return wxt.logger.warn('`[auto-icons]` icons property found in manifest, overwriting with auto-generated icons');
			}
			manifest.icons = Object.fromEntries([...resolvedPaths.keys()].map((size) => [size, `icons/${size}.png`]));
		});

		wxt.hooks.hook('build:done', async (wxt, output) => {
			const outputFolder = wxt.config.outDir;
			const generated = [];
			for (const [size, path] of resolvedPaths.entries()) {
				const resizedImage = sharp(path).resize(size).png();
				ensureDir(resolve(outputFolder, 'icons'));
				const generatedPath = resolve(outputFolder, 'icons', `${size}.png`);
				await resizedImage.toFile(generatedPath);
				generated.push(generatedPath);
				output.publicAssets.push({
					type: 'asset',
					fileName: `icons/${size}.png`,
				});
			}
			wxt.logger.info(`\`[auto-icons]\` Generated icon(s):\n${generated.map((path) => ` - ${relative(wxt.config.srcDir, path)}`).join('\n')}`);
		});

		wxt.hooks.hook('prepare:publicPaths', (wxt, paths) => {
			for (const size of resolvedPaths.keys()) {
				paths.push(`icons/${size}.png`);
			}
		});
	},
});

export interface AutoIconsOptions {
	enabled?: boolean;
	sizes: Record<number, string>;
}

declare module 'wxt' {
	export interface InlineConfig {
		autoIcons?: AutoIconsOptions;
	}
}
