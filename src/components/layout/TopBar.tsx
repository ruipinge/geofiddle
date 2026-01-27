import { Sun, Moon, Monitor, ExternalLink } from 'lucide-react';
import type { Theme } from '@/types';

interface TopBarProps {
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
}

export function TopBar({ theme, onThemeChange }: TopBarProps) {
    const cycleTheme = () => {
        const themes: Theme[] = ['light', 'dark', 'system'];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];
        if (nextTheme) {
            onThemeChange(nextTheme);
        }
    };

    const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

    return (
        <header className="flex h-10 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-3 md:h-14 md:px-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center gap-1.5 md:gap-2">
                <h1 className="text-lg font-semibold text-primary-600 md:text-xl dark:text-primary-400">
                    GeoFiddle
                </h1>
                <span className="rounded bg-primary-100 px-1 py-0.5 text-[10px] font-medium text-primary-700 md:px-1.5 md:text-xs dark:bg-primary-900 dark:text-primary-300">
                    v2
                </span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
                <button
                    onClick={cycleTheme}
                    className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100 md:p-2 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    aria-label={`Current theme: ${theme}. Click to change.`}
                >
                    <ThemeIcon className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <a
                    href="https://github.com/ruipinge/geofiddle"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden items-center gap-1 rounded-md px-2 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 md:flex dark:text-neutral-400 dark:hover:bg-neutral-800"
                    aria-label="View source on GitHub"
                >
                    <span>GitHub</span>
                    <ExternalLink className="h-4 w-4" />
                </a>
            </div>
        </header>
    );
}
