import { StrictMode } from 'react';
import App from './App';
import './style.css';

import { createRoot } from 'react-dom/client';

const container = document.getElementById('container');
if (!container) throw new Error('#root not found.');

const root = createRoot(container);
root.render(
	<StrictMode>
		<App />
	</StrictMode>,
);
