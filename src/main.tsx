import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';

declare const __SENTRY_RELEASE__: string;

interface PrivateConfig {
    apiKey?: string;
    mapId?: string;
    sentryDsn?: string;
}

async function initSentry(): Promise<void> {
    try {
        const response = await fetch('./PRIVATE.json');
        if (!response.ok) {
            return;
        }
        const config = await response.json() as PrivateConfig;
        if (config.sentryDsn) {
            Sentry.init({
                dsn: config.sentryDsn,
                release: __SENTRY_RELEASE__,
                environment: import.meta.env.MODE,
                enabled: import.meta.env.PROD,
                integrations: [
                    Sentry.browserTracingIntegration(),
                ],
                tracesSampleRate: 0.1,
            });
        }
    } catch {
        // PRIVATE.json not found or invalid - Sentry won't be initialized
    }
}

async function main(): Promise<void> {
    await initSentry();

    const rootElement = document.getElementById('root');
    if (!rootElement) {
        throw new Error('Failed to find root element');
    }

    createRoot(rootElement).render(
        <StrictMode>
            <App />
        </StrictMode>
    );
}

void main();
