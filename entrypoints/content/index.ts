import './style.css';

import { INVERT } from '#imports';
import HIGHLIGHT_OFF_SVG from '@/assets/bookmark.svg?raw';
import HIGHLIGHT_ON_SVG from '@/assets/bookmark_fill.svg?raw';
import HIGHLIGHT_CLEAR_SVG from '@/assets/bookmark_remove.svg?raw';
import UPDATE_DETAILS_OFF_SVG from '@/assets/chat_dashed.svg?raw';
import UPDATE_DETAILS_ON_SVG from '@/assets/chat_info_fill.svg?raw';
import * as c from '@/shared/constants';
import { footprints } from './footprints';
import { getLastUpdatedAuditView } from './getLastUpdatedAuditView';
import { highlightEnabled } from './highlightEnabled';
import { updateDetailsEnabled } from './updateDetailsEnabled';

type ADD = typeof ADD;
type INVERT = typeof INVERT;
type REMOVE = typeof REMOVE;

export default defineContentScript({
	matches: [...c.BACKLOG_URL_PATTERNS],
	main(ctx) {
		installIssueOpenEventListeners();
		installIssueDialogOpenEventListeners();
		addControlButtons(ctx);
		observe(ctx);
	},
});

function getIssueKey(ele: HTMLTableRowElement) {
	return ele.getAttribute('aria-label')?.match(/(?<=Issue )([A-Z0-9_]+-[1-9]\d*)/)?.[1] ?? null;
}

function rerenderAllHighlights() {
	const tbody = document.body.querySelector<HTMLTableSectionElement>('#issues-table > tbody');
	if (!tbody) return;
	tbody.querySelectorAll<HTMLTableRowElement>(`tr[${c.ATTRIBUTE_NAME_ISSUE_HIGHLIGHTED}]`).forEach((ele) => {
		ele.toggleAttribute(c.ATTRIBUTE_NAME_ISSUE_HIGHLIGHTED, false);
	});
	if (highlightEnabled()) {
		footprints().forEach((key) => {
			tbody.querySelectorAll<HTMLTableRowElement>(`tr[aria-label*="Issue ${key}"]`).forEach((ele) => {
				ele.toggleAttribute(c.ATTRIBUTE_NAME_ISSUE_HIGHLIGHTED, true);
			});
		});
	}
}

function rerenderAllUpdateDetails() {
	const tbody = document.body.querySelector<HTMLTableSectionElement>('#issues-table > tbody');
	if (!tbody) return;
	tbody.querySelectorAll<HTMLElement>('tr[data-row-index] [class^="_summary_title_text"]').forEach((ele) => {
		ele.innerText = ele.innerText.split('\n')[0]; // 最初の行だけ残す
	});
	if (updateDetailsEnabled()) {
		tbody.querySelectorAll<HTMLTableRowElement>('tr[data-row-index]').forEach((ele) => {
			const key = getIssueKey(ele);
			if (!key) return;
			const summary = ele.querySelector<HTMLElement>('[class^="_summary_title_text"]');
			if (summary) {
				const updated = getLastUpdatedAuditView(key);
				summary.innerText = `${summary.innerText}\n----------\n${i18n.t('label.lastUpdatedBy')}: ${updated.by}\n${i18n.t('label.lastUpdatedAt')}: ${updated.at}`;
			}
		});
	}
}

function highlight(ele: HTMLTableRowElement, mode: ADD | REMOVE | INVERT) {
	const key = getIssueKey(ele);
	if (!key) return;
	footprints(key, mode);
	// 対象の要素だけを更新していたが、他課題の子課題だった場合に両方とも既読の表示にする必要があるため、全体を再描画するように変更
	// const force = footprints(key, mode).includes(key);
	// ele.toggleAttribute(c.ATTRIBUTE_NAME_ISSUE_HIGHLIGHTED, force);
	rerenderAllHighlights();
}

// 課題を開いたときのイベントリスナーを登録する
function installIssueOpenEventListeners() {
	const point = { x: -1, y: -1 };
	function handleMouseDown(event: MouseEvent) {
		if (event.button !== 0) return;
		[point.x, point.y] = [event.pageX, event.pageY];
	}
	function handleMouseUpCapture(event: MouseEvent) {
		if (!highlightEnabled()) return;
		if (
			event.button === 0 &&
			point.x === event.pageX &&
			point.y === event.pageY &&
			event.target instanceof HTMLElement &&
			event.target.closest('button') == null
		) {
			const ele = event.target.closest<HTMLTableRowElement>('#issues-table > tbody > tr');
			if (ele) highlight(ele, ADD);
		}
	}
	window.addEventListener('mousedown', handleMouseDown);
	window.addEventListener('mouseup', handleMouseUpCapture, true);
}

// 課題ダイアログを開いたときのイベントリスナーを登録する
function installIssueDialogOpenEventListeners() {
	function handleClick(event: PointerEvent) {
		if (!highlightEnabled()) return;
		if (
			(event.button === 0 || event.button === 2) &&
			event.target instanceof HTMLButtonElement &&
			event.target.classList.contains('open-issue-dialog-trigger')
		) {
			const ele = event.target.closest<HTMLTableRowElement>('#issues-table > tbody > tr');
			if (!ele) return;
			if (event.button === 0) {
				highlight(ele, ADD);
			} else {
				event.preventDefault();
				event.stopPropagation();
				highlight(ele, INVERT);
			}
		}
	}
	window.addEventListener('click', handleClick);
	window.addEventListener('contextmenu', handleClick);
}

// コントロールボタンを追加する
function addControlButtons(ctx: InstanceType<typeof ContentScriptContext>) {
	function btn(): HTMLButtonElement {
		const button = document.createElement('button');
		button.classList.add('icon-button', 'icon-button--default', 'simptip-position-top', 'simptip-movable', 'simptip-smooth');
		return button;
	}
	createIntegratedUi(ctx, {
		position: 'inline',
		anchor: '#result-set > .result-set__controller > .result-set__controller-actions',
		tag: 'div',
		append(anchor, ui) {
			(ui as HTMLElement).style.marginRight = '4px';
			anchor.prepend(ui);
		},
		async onMount(wrapper) {
			// ハイライト関連
			{
				const active = highlightEnabled(await Vault.highlight_enabled.getValue(), true);
				// リセットボタン
				const reset = btn();
				reset.innerHTML = HIGHLIGHT_CLEAR_SVG;
				reset.setAttribute('data-tooltip', i18n.t('tooltip.reset'));
				reset.disabled = !active;
				reset.addEventListener('click', (event) => {
					if (!(highlightEnabled() && event.button === 0)) return;
					event.preventDefault();
					event.stopPropagation();
					const count = footprints().length;
					if (count === 0) {
						alert(i18n.t('alert.noRecords'));
						return;
					}
					if (confirm(`${i18n.t('confirm.reset')}\n${i18n.t('confirm.resetCount', count)}`)) {
						footprints(RESET);
						rerenderAllHighlights();
					}
				});
				// 有効/無効ボタン
				const toggle = btn();
				toggle.innerHTML = active ? HIGHLIGHT_ON_SVG : HIGHLIGHT_OFF_SVG;
				toggle.setAttribute('data-tooltip', active ? i18n.t('tooltip.disableHighlight') : i18n.t('tooltip.enableHighlight'));
				toggle.addEventListener('click', (event) => {
					if (event.button !== 0) return;
					event.preventDefault();
					event.stopPropagation();
					const next = highlightEnabled(INVERT);
					toggle.innerHTML = next ? HIGHLIGHT_ON_SVG : HIGHLIGHT_OFF_SVG;
					toggle.setAttribute('data-tooltip', next ? i18n.t('tooltip.disableHighlight') : i18n.t('tooltip.enableHighlight'));
					reset.disabled = !next;
					rerenderAllHighlights();
				});

				wrapper.append(toggle, reset);
			}
			// 最終更新情報関連
			{
				const active = updateDetailsEnabled(await Vault.update_details_enabled.getValue(), true);
				// 有効/無効ボタン
				const toggle = btn();
				toggle.innerHTML = active ? UPDATE_DETAILS_ON_SVG : UPDATE_DETAILS_OFF_SVG;
				toggle.setAttribute('data-tooltip', active ? i18n.t('tooltip.disableUpdateDetails') : i18n.t('tooltip.enableUpdateDetails'));
				toggle.addEventListener('click', (event) => {
					if (event.button !== 0) return;
					event.preventDefault();
					event.stopPropagation();
					const next = updateDetailsEnabled(INVERT);
					toggle.innerHTML = next ? UPDATE_DETAILS_ON_SVG : UPDATE_DETAILS_OFF_SVG;
					toggle.setAttribute('data-tooltip', next ? i18n.t('tooltip.disableUpdateDetails') : i18n.t('tooltip.enableUpdateDetails'));
					rerenderAllUpdateDetails();
				});

				wrapper.prepend(toggle);
			}
		},
	}).autoMount();
}

// 課題一覧の変更を監視してハイライトや最終更新情報を反映する
function observe(ctx: InstanceType<typeof ContentScriptContext>) {
	function apply(nodes: Node[]) {
		for (const node of nodes) {
			if (!(node instanceof HTMLTableRowElement && node.hasAttribute('data-row-index'))) continue;
			const key = getIssueKey(node);
			if (!key) continue;
			// 最終更新情報の追加
			{
				const summary = node.querySelector<HTMLElement>('[class^="_summary_title_text"]');
				if (summary && updateDetailsEnabled()) {
					const updated = getLastUpdatedAuditView(key);
					summary.innerText = `${summary.innerText.split('\n')[0]}\n----------\n${i18n.t('label.lastUpdatedBy')}: ${updated.by}\n${i18n.t('label.lastUpdatedAt')}: ${updated.at}`;
				}
			}
			// ハイライトの適用
			{
				if (highlightEnabled()) {
					const highlighted = footprints().includes(key);
					node.toggleAttribute(c.ATTRIBUTE_NAME_ISSUE_HIGHLIGHTED, highlighted);
				}
			}
		}
	}

	// ページ遷移や子課題の展開などで課題一覧が書き換えられたときに発火するオブザーバー
	const observer = new MutationObserver((mutations) => {
		const execute = () => {
			const nodes = mutations.reduce<Node[]>((acc, mutation) => {
				if (
					mutation.type === 'childList' &&
					mutation.target instanceof HTMLTableSectionElement &&
					mutation.target.parentElement?.id === 'issues-table'
				) {
					// tbody直下に追加されたノードを収集
					acc.push(...mutation.addedNodes);
				} else if (
					mutation.type === 'childList' &&
					mutation.target instanceof HTMLElement &&
					mutation.target.matches('[class^="_summary_title_text"]')
				) {
					// タイトルテキストが変更された行を収集
					// ただし、拡張機能自身が変更した場合は無視
					if (mutation.target.hasAttribute(c.ATTRIBUTE_NAME_ISSUE_UPDATE_DETAILS_IGNORED)) {
						mutation.target.removeAttribute(c.ATTRIBUTE_NAME_ISSUE_UPDATE_DETAILS_IGNORED);
					} else {
						const row = mutation.target.closest<HTMLTableRowElement>('tr[data-row-index]');
						if (row) {
							mutation.target.toggleAttribute(c.ATTRIBUTE_NAME_ISSUE_UPDATE_DETAILS_IGNORED, true);
							acc.push(row);
						}
					}
				}

				return acc;
			}, []);
			apply(nodes);
		};
		// 読み込み中でなければ即時実行
		const loadingParent = document.querySelector('#result-set > .result-set__main:has(table#issues-table)');
		if (!loadingParent || loadingParent.querySelector('.loading--circle') == null) {
			execute();
		} else {
			new MutationObserver((mutations, observer) => {
				const removedNodes = mutations.flatMap((mutation) => [...mutation.removedNodes]);
				if (removedNodes.some((node) => node instanceof HTMLElement && node.classList.contains('loading--circle'))) {
					observer.disconnect();
					execute();
				}
			}).observe(loadingParent, { childList: true });
		}
	});

	createIntegratedUi(ctx, {
		position: 'inline',
		anchor: '#issues-table > tbody',
		append() {}, // 要素の追加は不要
		onMount() {
			const tbody = document.querySelector('#issues-table > tbody');
			if (!tbody) return;
			// 課題の詳細から戻ってきた場合、既に行が存在している
			const rows = tbody.querySelectorAll<HTMLTableRowElement>('tr[data-row-index]');
			if (rows.length > 0) apply([...rows]);
			observer.observe(tbody, { childList: true, subtree: true });
		},
		onRemove() {
			observer.disconnect();
		},
	}).autoMount();
}
