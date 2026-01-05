import * as c from '@/shared/constants';

type INVERT = typeof INVERT;

export function updateDetailsEnabled(): boolean;
export function updateDetailsEnabled(next: boolean | INVERT): boolean;
export function updateDetailsEnabled(next: boolean, keepCurrent: true): boolean;
export function updateDetailsEnabled(next?: boolean | INVERT, keepCurrent?: true): boolean {
	const key = keyify(c.SESSION_STORAGE_KEY_UPDATE_DETAILS_ENABLED);
	const current = ((raw) => {
		if (!raw) return null;
		try {
			const v = JSON.parse(raw);
			if (typeof v === 'boolean') return v;
		} catch {} // eslint-disable-line no-empty
		return null;
	})(sessionStorage.getItem(key));
	if (next == null) return current ?? true;
	if (keepCurrent && current != null) return current;
	if (next === INVERT) next = !(current ?? true);
	sessionStorage.setItem(key, JSON.stringify(next));
	return next;
}
