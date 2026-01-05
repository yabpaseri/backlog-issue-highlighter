import * as c from '@/shared/constants';
import { Audit, AuditView } from '@/types';

/**
 * 課題の最終更新者情報を取得する
 * @param issueKey
 * @returns
 */
export function getLastUpdatedAuditView(issueKey: string): AuditView {
	const key = keyify(c.SESSION_STORAGE_KEY_ISSUE_UPDATE_DETAILS);
	const raw = sessionStorage.getItem(key);
	if (raw) {
		try {
			const v: Audit[] = JSON.parse(raw);
			const audit = v.find((e) => e.key === issueKey);
			if (audit) return { at: formatDate(new Date(audit.at)), by: audit.by };
		} catch {} // eslint-disable-line no-empty
	}
	return { at: i18n.t('common.unknown'), by: i18n.t('common.unknown') };
}
