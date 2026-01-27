import { useEffect } from 'react';
import { TopBar } from './TopBar';
import { SplitPane } from './SplitPane';
import { MobileLayout } from './MobileLayout';
import { LeftPanel } from './LeftPanel';
import { MapContainer } from '@/components/map/MapContainer';
import { useUIStore } from '@/stores/uiStore';
import { useIsMobile } from '@/hooks/useIsMobile';

// Min: ~20%, Max: 2/3 (66.67%)
const MIN_LEFT_WIDTH_PERCENT = 20;
const MAX_LEFT_WIDTH_PERCENT = 66.67;

export function AppShell() {
    const { theme, setTheme, leftPanelWidthPercent, setLeftPanelWidthPercent } = useUIStore();
    const isMobile = useIsMobile();

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
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>
            <TopBar theme={theme} onThemeChange={setTheme} />
            {isMobile ? (
                <MobileLayout />
            ) : (
                <SplitPane
                    left={<LeftPanel />}
                    right={<MapContainer />}
                    leftWidthPercent={leftPanelWidthPercent}
                    minLeftWidthPercent={MIN_LEFT_WIDTH_PERCENT}
                    maxLeftWidthPercent={MAX_LEFT_WIDTH_PERCENT}
                    onLeftWidthPercentChange={setLeftPanelWidthPercent}
                />
            )}
        </div>
    );
}
