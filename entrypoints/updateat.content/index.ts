declare const window: Window['window'] & {
	fetch_: typeof fetch;
};

function keyify(name: string) {
	const url = new URL(location.href);
	return `${url.hostname}:${url.pathname.split('/').at(-1)}:${name}`;
}

export default defineContentScript({
	matches: ['*://*.backlog.com/*', '*://*.backlog.jp/*'],
	runAt: 'document_start',
	world: 'MAIN',
	main() {
		window.fetch_ = window.fetch;
		window.fetch = async function (...args: Parameters<typeof fetch>) {
			const response = await window.fetch_.apply(this, args);
			const url = ((arg0) => {
				switch (true) {
					case typeof arg0 === 'string':
						return new URL(arg0, window.location.href);
					case arg0 instanceof URL:
						return arg0;
					case arg0 instanceof Request:
						return new URL(arg0.url, window.location.href);
					default:
						return new URL(String(arg0), window.location.href);
				}
			})(args[0]);

			const isIssues =
				(url.pathname === '/r/findIssuesAllOver.json' || /^\/r\/projects\/[A-Z0-9_]+\/findIssues.json$/.test(url.pathname)) &&
				response.headers.get('Content-Type')?.includes('application/json');

			if (isIssues) {
				const json = await response.clone().json();
				sessionStorage.setItem(keyify('lastIssuesResponse'), JSON.stringify(json));
			}
			return response;
		};

		window.addEventListener('mouseover', (ev) => {
			const td = ev.target instanceof HTMLElement ? ev.target.closest('table#issues-table tbody > tr[data-row-index] td') : null;
			const tr = td?.closest('tr[data-row-index]');
			if (!(td && tr && tr.firstElementChild?.contains(td))) return;

			const wrapper = ((wrapper_) => {
				if (wrapper_) {
					wrapper_.removeAttribute('data-tooltip');
					return wrapper_;
				}
				wrapper_ = document.createElement('span');
				wrapper_.classList.add('simptip-wrapper', 'simptip-position-top', 'simptip-movable', 'simptip-smooth');
				wrapper_.style.margin = '-6px -8px -6px -15px';
				wrapper_.style.width = 'calc(100% + 23px)';
				wrapper_.style.height = 'calc(100% + 12px)';
				wrapper_.append(...td.childNodes);
				td.append(wrapper_);
				return wrapper_;
			})(td.querySelector<HTMLElement>('.simptip-wrapper'));

			const issueKey = td.parentElement?.getAttribute('aria-label')?.split(' ').at(-1);
			if (!issueKey) return;
			const json = sessionStorage.getItem(keyify('lastIssuesResponse'));
			if (!json) return;
			const issues: { issueKey: string; updatedUser: { name: string } }[] = JSON.parse(json).issues;
			const issue = issues.find((issue) => issue.issueKey === issueKey);
			if (!issue) return;
			wrapper.setAttribute('data-tooltip', `最終更新者: ${issue.updatedUser.name}`);

			// const div = ev.target instanceof HTMLElement ? ev.target.closest('table#issues-table td.cell-summary > div') : null;
			// if (!div) return;
			// div.classList.remove('simptip-position-top', 'simptip-movable', 'simptip-smooth');
			// const issueKey = div.parentElement?.parentElement?.getAttribute('aria-label')?.split(' ').at(-1);
			// if (!issueKey) return;
			// const json = sessionStorage.getItem(keyify('lastIssuesResponse'));
			// if (!json) return;
			// const issues: { issueKey: string; updatedUser: { name: string } }[] = JSON.parse(json).issues;
			// const issue = issues.find((issue) => issue.issueKey === issueKey);
			// if (!issue) return;
			// div.classList.add('simptip-position-top', 'simptip-movable', 'simptip-smooth');
			// div.setAttribute('data-tooltip', `最終更新者: ${issue.updatedUser.name}`);
		});
	},
});
