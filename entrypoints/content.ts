export default defineContentScript({
	matches: ['*://*.google.com/*'],
	main() {
		Messenger.sendMessage('about').then((response) => {
			console.log(response);
		});
	},
});
