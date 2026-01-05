export default defineBackground(() => {
	console.log('Hello background!', { id: browser.runtime.id });
	Messenger.onMessage('about', (message) => {
		return { ...message };
	});
});
