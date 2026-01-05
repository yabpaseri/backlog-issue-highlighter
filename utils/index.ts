/**
 * 反転を表すシンボル
 */
export const INVERT = Symbol('INVERT');

/**
 * リセットを表すシンボル
 */
export const RESET = Symbol('RESET');

/**
 * 追加を表すシンボル
 */
export const ADD = Symbol('ADD');

/**
 * 削除を表すシンボル
 */
export const REMOVE = Symbol('REMOVE');

/**
 * Backlogのフォーマットである「YYYY/MM/DD HH:mm:ss」形式の日付文字列に変換する
 * @param date
 * @returns
 */
export function formatDate(date: Date): string {
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	const seconds = date.getSeconds().toString().padStart(2, '0');
	return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * ウェブストレージ等で使用するキーを生成する
 * @param name
 * @param gThis
 * @returns
 */
export function keyify(name: string, gThis: typeof globalThis = globalThis): string {
	const url = new URL(gThis.location.href);
	return `${url.hostname}${url.pathname.split('/').join(':')}:${name}`;
}
