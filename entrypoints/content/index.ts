import './style.css';

import HIGHLIGHT_OFF_SVG from '@/assets/bookmark.svg?raw';
import HIGHLIGHT_ON_SVG from '@/assets/bookmark_fill.svg?raw';
import HIGHLIGHT_CLEAR_SVG from '@/assets/bookmark_remove.svg?raw';
import { defaultEnabled } from '@/utils/store';
import { createLocationWatcher, LocationChangeEvent } from './location-watcher';

const ATTR = { ACTIVE: 'active', HIGHLIGHT: 'highlight' } as const;
const MATCHES = ['https://*.backlog.com/*', 'https://*.backlog.jp/*'];
const PATTERNS = [
	new MatchPattern('https://*.backlog.jp/find/*'),
	new MatchPattern('https://*.backlog.jp/FindIssueAllOver.action'),
	new MatchPattern('https://*.backlog.com/find/*'),
	new MatchPattern('https://*.backlog.com/FindIssueAllOver.action'),
];
const INV = Symbol('invert');

function keyify(name: string) {
	const url = new URL(location.href);
	return `${browser.runtime.id}:${url.hostname}:${url.pathname.split('/').at(-1)}:${name}`;
}

// 有効状態の取得・更新
function enabled(next?: boolean | typeof INV): boolean;
function enabled(next: boolean, init?: boolean): boolean;
function enabled(next?: boolean | typeof INV, init = false): boolean {
	const key = keyify('enabled');
	const current: boolean | null = ((json) => {
		if (!json) return null;
		try {
			const bool = JSON.parse(json);
			if (typeof bool === 'boolean') return bool;
		} catch {} // eslint-disable-line no-empty
		return null;
	})(sessionStorage.getItem(key));
	if (next == null) return current ?? false;
	if (init && current != null) next = current;
	if (next === INV) next = !current;
	sessionStorage.setItem(key, JSON.stringify(next));
	return next;
}

// ハイライト対象の取得・追加・削除・クリア
function h(): string[]; // 取得
function h(value: false): string[]; // クリア
function h(value: string | null, add?: boolean): string[]; // 追加/削除
function h(value?: false | string | null, add = true): string[] {
	const key = keyify('highlights');
	if (value === false) {
		sessionStorage.removeItem(key);
		return [];
	}
	const current: Set<string> = ((json) => {
		if (!json) return new Set();
		try {
			const arr = JSON.parse(json);
			if (Array.isArray(arr)) return new Set(arr.filter((v) => typeof v === 'string'));
		} catch {} // eslint-disable-line no-empty
		return new Set();
	})(sessionStorage.getItem(key));

	if (value == null) {
		return Array.from(current);
	} else {
		(add ? current.add.bind(current) : current.delete.bind(current))(value);
		const arr = Array.from(current);
		sessionStorage.setItem(key, JSON.stringify(arr));
		return arr;
	}
}

// ハイライト設定
function highlight(row: HTMLTableRowElement, force: boolean) {
	row.toggleAttribute(ATTR.HIGHLIGHT, force);
	h(row.ariaLabel, force);
}

// 『ダイアログで課題を表示する』ボタンのイベントハンドラ (click, contextmenu)
function handleOpenDialogClick(ev: PointerEvent) {
	if (!enabled()) return;
	if (
		(ev.button === 0 || ev.button === 2) && // right or left click
		ev.target instanceof HTMLButtonElement &&
		ev.target.parentElement instanceof HTMLElement &&
		ev.target.parentElement.classList.contains('open-issue-dialog-trigger')
	) {
		const right = ev.button === 2;
		const row = ev.target.closest<HTMLTableRowElement>('#issues-table > tbody > tr');
		if (!row) return;
		if (right) {
			ev.preventDefault();
			ev.stopPropagation();
			highlight(row, !row.hasAttribute(ATTR.HIGHLIGHT));
		} else {
			highlight(row, true);
		}
	}
}

// 課題を通常通り開くイベントのハンドラ。mousedown/mouseupで座標が変化していないことが条件。
const point = { x: -1, y: -1 };
function handleMousedown(ev: MouseEvent) {
	if (ev.button === 0) {
		[point.x, point.y] = [ev.pageX, ev.pageY];
	}
}
function handleMouseupCapture(ev: MouseEvent) {
	if (!enabled()) return;
	if (
		ev.button === 0 && // right click
		point.x === ev.pageX && // non-moving
		point.y === ev.pageY && // non-moving
		ev.target instanceof HTMLElement &&
		ev.target.closest('button') == null
	) {
		const row = ev.target.closest<HTMLTableRowElement>('#issues-table > tbody > tr');
		if (row) highlight(row, true);
	}
}

function render(url: string | URL = location.href) {
	if (PATTERNS.every((p) => !p.includes(url))) return;
	const tbody = document.body.querySelector<HTMLTableSectionElement>('#issues-table > tbody');
	if (!tbody) return;

	// 一度、全ハイライトを解除
	tbody.querySelectorAll<HTMLTableRowElement>(`tr[${ATTR.HIGHLIGHT}]`).forEach((row) => {
		row.toggleAttribute(ATTR.HIGHLIGHT, false);
	});
	// 必要な部分だけ再ハイライト
	if (enabled()) {
		h().forEach((value) => {
			const row = tbody.querySelector<HTMLTableRowElement>(`tr[aria-label="${value}"]`);
			if (row) row.toggleAttribute(ATTR.HIGHLIGHT, true);
		});
	}
}

function newIconButton(): HTMLButtonElement {
	const button = document.createElement('button');
	button.classList.add('icon-button', 'icon-button--default', 'simptip-position-top', 'simptip-movable', 'simptip-smooth');
	return button;
}

export default defineContentScript({
	matches: MATCHES,
	main(ctx) {
		window.addEventListener('click', handleOpenDialogClick);
		window.addEventListener('contextmenu', handleOpenDialogClick);
		window.addEventListener('mousedown', handleMousedown);
		window.addEventListener('mouseup', handleMouseupCapture, { capture: true });

		// WXTが実装しているlocationchangeを用いてSPAのURLの変化を検知しようとした。
		//   ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl }) => {
		//       process(newUrl);
		//   });
		// しかし、WXTの実装は1000msごとにURLの比較をするものであり、素早くページ移動をしたときの検知が間に合わない。
		// https://github.com/wxt-dev/wxt/issues/1567
		// NavigationAPIで云々というアプローチが正しいのかもしれないが、とりあえずWXTの実装を参考にインターバルを短くする方向で試してみる。
		// 本家のsetIntervalの実装は踏襲せず、requestAnimationFrameの再帰呼び出しで実装した。
		window.addEventListener(LocationChangeEvent.EVENT_NAME, (ev) => {
			const { newUrl } = ev as LocationChangeEvent;
			const tableWrapper = document.querySelector('#result-set > .result-set__main:has(table#issues-table)');
			if (tableWrapper) {
				// ページ遷移時、URLが変更される⇒DOMの更新が始まる の順に処理が進むので、
				// URL変更検知と同時に再描画を始めると早すぎて反映がされない。
				// スピナーが消えるのを待つ。
				new MutationObserver((mutations, observer) => {
					const nodes = mutations.map((mutation) => [...mutation.removedNodes]).flat();
					if (nodes.some((node) => node instanceof Element && node.classList.contains('loading--circle'))) {
						observer.disconnect();
						render(newUrl);
					}
				}).observe(tableWrapper, { childList: true });
			} else {
				render(newUrl);
			}
		});
		createLocationWatcher(ctx).run();

		// 初回レンダリングは要素の出現を待つ必要がある。
		createIntegratedUi(ctx, {
			position: 'inline',
			anchor: '#issues-table > tbody > tr',
			onMount() {
				render();
			},
		}).autoMount();

		// 操作ボタンの追加
		createIntegratedUi(ctx, {
			position: 'inline',
			anchor: '#result-set > .result-set__controller > .result-set__controller-actions',
			tag: 'div',
			append(anchor, ui) {
				(ui as HTMLElement).style.marginRight = '4px';
				anchor.prepend(ui);
			},
			async onMount(container) {
				const active = enabled(await defaultEnabled.getValue(), true);
				// クリアボタン
				const clearer = newIconButton();
				clearer.innerHTML = HIGHLIGHT_CLEAR_SVG;
				clearer.setAttribute('data-tooltip', '閲覧済み課題の記録をリセット');
				clearer.disabled = !active;
				clearer.addEventListener('click', (ev) => {
					if (ev.button !== 0 || !enabled()) return;
					ev.preventDefault();
					ev.stopPropagation();
					const count = h().length;
					if (count === 0) {
						alert('閲覧済み課題の記録が存在しません。');
					} else if (window.confirm(`閲覧済み課題の記録(${count}件)をリセットします。よろしいですか？`)) {
						h(false);
						render();
					}
				});

				// 有効化ボタン
				const activator = newIconButton();
				activator.innerHTML = active ? HIGHLIGHT_ON_SVG : HIGHLIGHT_OFF_SVG;
				activator.setAttribute('data-tooltip', '閲覧済み課題のハイライト機能のON/OFF');
				activator.addEventListener('click', (ev) => {
					if (ev.button !== 0) return;
					ev.preventDefault();
					ev.stopPropagation();
					const active = enabled(INV);
					activator.innerHTML = active ? HIGHLIGHT_ON_SVG : HIGHLIGHT_OFF_SVG;
					clearer.disabled = !active;
					render();
				});

				container.append(activator, clearer);
			},
		}).autoMount();
	},
});
