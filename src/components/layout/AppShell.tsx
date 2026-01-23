import { useState, useEffect } from 'react';
import { TopBar } from './TopBar';
import { SplitPane } from './SplitPane';
import { LeftPanel } from './LeftPanel';
import { MapContainer } from '@/components/map/MapContainer';
import type { Theme } from '@/types';

export function AppShell() {
    const [theme, setTheme] = useState<Theme>('system');

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches
                ? 'dark'
                : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }
    }, [theme]);

    return (
        <div className="flex h-full flex-col">
            <TopBar theme={theme} onThemeChange={setTheme} />
            <SplitPane
                left={<LeftPanel />}
                right={<MapContainer />}
                defaultLeftWidth={400}
                minLeftWidth={300}
                maxLeftWidth={600}
            />
        </div>
    );
}
