import { useEffect, useState } from 'react';
import { Unwatch } from 'wxt/utils/storage';

export default function App() {
	const [enabled, setEnabled] = useState(false);

	useEffect(() => {
		let unwatch: Unwatch | undefined;
		(async function init() {
			setEnabled(await defaultEnabled.getValue());
			unwatch = defaultEnabled.watch((value) => setEnabled(value));
		})();
		return () => {
			if (unwatch != null) unwatch();
		};
	}, []);

	const handleToggle = async () => {
		const newValue = !enabled;
		await defaultEnabled.setValue(newValue);
	};

	return (
		<div
			style={{
				padding: '20px',
				maxWidth: '600px',
				margin: '0 auto',
				fontFamily: 'system-ui, -apple-system, sans-serif',
			}}
		>
			<h2 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: '500' }}>設定</h2>

			<div
				style={{
					padding: '16px',
					border: '1px solid #e0e0e0',
					borderRadius: '8px',
					backgroundColor: '#f9f9f9',
				}}
			>
				<label
					style={{
						display: 'flex',
						alignItems: 'center',
						cursor: 'pointer',
						gap: '12px',
					}}
				>
					<input
						type="checkbox"
						checked={enabled}
						onChange={handleToggle}
						style={{
							width: '18px',
							height: '18px',
							cursor: 'pointer',
						}}
					/>
					<div>
						<div style={{ fontWeight: '500', marginBottom: '4px' }}>閲覧済み課題のハイライトをデフォルトでONにする</div>
						<div style={{ fontSize: '14px', color: '#666' }}>
							この設定を有効にすると、ページ読み込み時に自動的にハイライト表示されます
						</div>
					</div>
				</label>
			</div>
		</div>
	);
}
