import { useEffect } from 'react';
import { TopBar } from './TopBar';
import { SplitPane } from './SplitPane';
import { LeftPanel } from './LeftPanel';
import { MapContainer } from '@/components/map/MapContainer';
import { useUIStore } from '@/stores/uiStore';

export function AppShell() {
    const { theme, setTheme } = useUIStore();

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

    // Listen for system theme changes when using 'system' theme
    useEffect(() => {
        if (theme !== 'system') {
            return;
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            const root = window.document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => { mediaQuery.removeEventListener('change', handleChange); };
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
