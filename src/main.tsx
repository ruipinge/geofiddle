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
    googleAnalyticsId?: string;
}

function initGoogleAnalytics(measurementId: string): void {
    // Load gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer ?? [];
    const dataLayer = window.dataLayer;
    function gtag(...args: unknown[]): void {
        dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', measurementId);
}

declare global {
    interface Window {
        dataLayer?: unknown[];
    }
}

async function initServices(): Promise<void> {
    // Only initialize in production
    if (!import.meta.env.PROD) {
        return;
    }

    try {
        const response = await fetch('./PRIVATE.json');
        if (!response.ok) {
            return;
        }
        const config = await response.json() as PrivateConfig;

        // Initialize Sentry
        if (config.sentryDsn) {
            Sentry.init({
                dsn: config.sentryDsn,
                release: __SENTRY_RELEASE__,
                environment: import.meta.env.MODE,
                enabled: true,
                integrations: [
                    Sentry.browserTracingIntegration(),
                ],
                tracesSampleRate: 0.1,
            });
        }

        // Initialize Google Analytics
        if (config.googleAnalyticsId) {
            initGoogleAnalytics(config.googleAnalyticsId);
        }
    } catch {
        // PRIVATE.json not found or invalid - services won't be initialized
    }
}

async function main(): Promise<void> {
    await initServices();

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
