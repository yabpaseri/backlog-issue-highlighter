import * as c from '@/shared/constants';
import { Audit, Issue } from '@/types';

declare const window: Window['window'] & { __fetch__: typeof fetch };
const FIND_ISSUES_JSON_URL_REGEX = /^\/r\/(?:projects\/[A-Z0-9_]+\/findIssues|findIssuesAllOver)\.json$/;

/**
 * 課題一覧の取得をフックして、課題の最終更新情報をセッションストレージに保存するコンテンツスクリプト
 */
export default defineContentScript({
	matches: [...c.BACKLOG_URL_PATTERNS],
	world: 'MAIN',
	runAt: 'document_start',
	main() {
		const fetch = (window.__fetch__ = window.fetch);
		window.fetch = async function (...args: Parameters<typeof fetch>) {
			const response = await fetch.apply(this, args);
			if (response.ok && response.headers.get('Content-Type')?.includes('application/json')) {
				const url = ((arg0) => {
					if (arg0 instanceof URL) return arg0;
					const url = typeof arg0 === 'string' ? arg0 : arg0 instanceof Request ? arg0.url : String(arg0);
					return new URL(url, location.href);
				})(args[0]);

				if (FIND_ISSUES_JSON_URL_REGEX.test(url.pathname)) {
					const json = await response.clone().json();
					const issues: Issue[] = json.issues;
					const updated: Map<string, Audit> = new Map();
					for (const issue of issues) {
						if (!updated.has(issue.issueKey)) {
							updated.set(issue.issueKey, { key: issue.issueKey, at: issue.updated, by: issue.updatedUser.name });
						}
						for (const child of issue.childIssues) {
							if (!updated.has(child.issueKey)) {
								updated.set(child.issueKey, { key: child.issueKey, at: child.updated, by: child.updatedUser.name });
							}
						}
					}
					sessionStorage.setItem(keyify(c.SESSION_STORAGE_KEY_ISSUE_UPDATE_DETAILS), JSON.stringify(updated.values().toArray()));
				}
			}
			return response;
		};
	},
});
