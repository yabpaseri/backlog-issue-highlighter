import { useEffect, useState } from 'react';
import { Unwatch } from 'wxt/utils/storage';

export default function App() {
	const [highlightEnabled, setHighlightEnabled] = useState(false);
	const [updateDetailsEnabled, setUpdateDetailsEnabled] = useState(false);

	useEffect(() => {
		let unwatchHighlight: Unwatch | undefined;
		let unwatchUpdateDetails: Unwatch | undefined;
		(async function init() {
			setHighlightEnabled(await Vault.highlight_enabled.getValue());
			setUpdateDetailsEnabled(await Vault.update_details_enabled.getValue());
			unwatchHighlight = Vault.highlight_enabled.watch((value) => setHighlightEnabled(value));
			unwatchUpdateDetails = Vault.update_details_enabled.watch((value) => setUpdateDetailsEnabled(value));
		})();
		return () => {
			if (unwatchHighlight != null) unwatchHighlight();
			if (unwatchUpdateDetails != null) unwatchUpdateDetails();
		};
	}, []);

	const handleHighlightToggle = async () => {
		const newValue = !highlightEnabled;
		await Vault.highlight_enabled.setValue(newValue);
	};

	const handleUpdateDetailsToggle = async () => {
		const newValue = !updateDetailsEnabled;
		await Vault.update_details_enabled.setValue(newValue);
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
			<h2 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: '500' }}>{i18n.t('options.title')}</h2>

			<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
							checked={highlightEnabled}
							onChange={handleHighlightToggle}
							style={{
								width: '18px',
								height: '18px',
								cursor: 'pointer',
							}}
						/>
						<div>
							<div style={{ fontWeight: '500', marginBottom: '4px' }}>{i18n.t('options.highlightEnabled.label')}</div>
							<div style={{ fontSize: '14px', color: '#666' }}>{i18n.t('options.highlightEnabled.description')}</div>
						</div>
					</label>
				</div>

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
							checked={updateDetailsEnabled}
							onChange={handleUpdateDetailsToggle}
							style={{
								width: '18px',
								height: '18px',
								cursor: 'pointer',
							}}
						/>
						<div>
							<div style={{ fontWeight: '500', marginBottom: '4px' }}>{i18n.t('options.updateDetailsEnabled.label')}</div>
							<div style={{ fontSize: '14px', color: '#666' }}>{i18n.t('options.updateDetailsEnabled.description')}</div>
						</div>
					</label>
				</div>
			</div>
		</div>
	);
}
