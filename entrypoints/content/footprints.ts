import * as c from '@/shared/constants';

type ADD = typeof ADD;
type INVERT = typeof INVERT;
type REMOVE = typeof REMOVE;
type RESET = typeof RESET;

/**
 * 閲覧済み課題のキー一覧を取得・操作する
 */
export function footprints(): string[];
export function footprints(value: RESET): string[];
export function footprints(value: string | null, mode: ADD | REMOVE | INVERT): string[];
export function footprints(value?: string | null | RESET, mode?: ADD | REMOVE | INVERT): string[] {
	const key = keyify(c.SESSION_STORAGE_KEY_FOOTPRINTS);
	if (value === RESET) {
		sessionStorage.removeItem(key);
		return [];
	}
	const current: Set<string> = new Set(
		((raw) => {
			if (!raw) return [];
			try {
				const v = JSON.parse(raw);
				if (Array.isArray(v)) return v.filter((e) => typeof e === 'string');
			} catch {} // eslint-disable-line no-empty
			return [];
		})(sessionStorage.getItem(key)),
	);
	if (value == null) return Array.from(current);
	if (mode === INVERT) mode = current.has(value) ? REMOVE : ADD;
	if (mode === ADD) {
		current.add(value);
	} else {
		current.delete(value);
	}
	const updated = Array.from(current);
	sessionStorage.setItem(key, JSON.stringify(updated));
	return updated;
}
