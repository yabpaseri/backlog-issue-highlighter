import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ['@wxt-dev/module-react'],
	manifest: {
		name: 'Backlog Issue Highlighter',
		permissions: ['storage'],
	},
	autoIcons: {
		sizes: {
			16: 'assets/icon16.svg',
			32: 'assets/icon32_48.svg',
			48: 'assets/icon32_48.svg',
			96: 'assets/icon96_128.svg',
			128: 'assets/icon96_128.svg',
		},
	},
});
