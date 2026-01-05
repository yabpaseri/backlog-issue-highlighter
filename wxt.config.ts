import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
	manifest: {
		default_locale: 'en',
	},
	autoIcons: {
		sizes: {
			16: './assets/wxt.svg',
			32: './assets/wxt.svg',
			48: './assets/wxt.svg',
			128: './assets/wxt.svg',
		},
	},
});
