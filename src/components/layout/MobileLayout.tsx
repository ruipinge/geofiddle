import { useState } from 'react';
import { FileText, Map } from 'lucide-react';
import { LeftPanel } from './LeftPanel';
import { MapContainer } from '@/components/map/MapContainer';

type MobileTab = 'input' | 'map';

export function MobileLayout() {
    const [activeTab, setActiveTab] = useState<MobileTab>('input');

    return (
        <main id="main-content" className="flex flex-1 flex-col overflow-hidden" role="main">
            {/* Content area */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'input' ? (
                    <div className="h-full overflow-y-auto">
                        <LeftPanel />
                    </div>
                ) : (
                    <MapContainer />
                )}
            </div>

            {/* Bottom tab bar - compact */}
            <nav
                className="flex shrink-0 border-t border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                role="tablist"
                aria-label="Main navigation"
            >
                <button
                    role="tab"
                    aria-selected={activeTab === 'input'}
                    aria-controls="input-panel"
                    onClick={() => { setActiveTab('input'); }}
                    className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                        activeTab === 'input'
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                    }`}
                >
                    <FileText className="h-4 w-4" />
                    <span>Input</span>
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'map'}
                    aria-controls="map-panel"
                    onClick={() => { setActiveTab('map'); }}
                    className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                        activeTab === 'map'
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                    }`}
                >
                    <Map className="h-4 w-4" />
                    <span>Map</span>
                </button>
            </nav>
        </main>
    );
}
