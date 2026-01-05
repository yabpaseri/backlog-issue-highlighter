import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
	manifest: {
		name: 'Backlog Issue Highlighter',
		default_locale: 'en',
		permissions: ['storage'],
	},
	autoIcons: {
		sizes: {
			16: './assets/icon/icon_L3.svg',
			32: './assets/icon/icon_L3.svg',
			48: './assets/icon/icon_L3.svg',
			128: './assets/icon/icon_L3.svg',
		},
	},
});
