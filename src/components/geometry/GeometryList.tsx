import { useCallback } from 'react';
import { useGeometryStore } from '@/stores/geometryStore';
import { GeometryRow } from './GeometryRow';

interface GeometryListProps {
    onPanToFeature?: (featureId: string) => void;
}

export function GeometryList({ onPanToFeature }: GeometryListProps) {
    const { features, selectedFeatureId, setSelectedFeatureId, setHoveredFeatureId } = useGeometryStore();

    const handleSelectFeature = useCallback(
        (featureId: string) => {
            // Toggle selection: deselect if already selected, otherwise select and pan
            if (selectedFeatureId === featureId) {
                setSelectedFeatureId(null);
            } else {
                setSelectedFeatureId(featureId);
                onPanToFeature?.(featureId);
            }
        },
        [selectedFeatureId, setSelectedFeatureId, onPanToFeature]
    );

    const handleHoverFeature = useCallback(
        (featureId: string | null) => {
            setHoveredFeatureId(featureId);
        },
        [setHoveredFeatureId]
    );

    if (features.length === 0) {
        return (
            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                No geometries to display
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
            <div className="max-h-80 overflow-auto">
                {features.map((feature, index) => (
                    <GeometryRow
                        key={feature.id}
                        feature={feature}
                        index={index}
                        isSelected={selectedFeatureId === feature.id}
                        onSelect={() => { handleSelectFeature(feature.id); }}
                        onHover={(isHovering) => { handleHoverFeature(isHovering ? feature.id : null); }}
                    />
                ))}
            </div>
            <div className="border-t border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                {features.length} {features.length === 1 ? 'geometry' : 'geometries'}
            </div>
        </div>
    );
}
