import { InputArea } from '@/components/input/InputArea';
import { ConversionArea } from '@/components/conversion/ConversionArea';
import { GeometryList } from '@/components/geometry/GeometryList';
import { useMapStore } from '@/stores/mapStore';

export function LeftPanel() {
    const panToFeature = useMapStore((state) => state.panToFeature);

    return (
        <div className="flex h-full flex-col overflow-y-auto bg-neutral-50 dark:bg-neutral-900">
            <InputArea />
            <div className="border-t border-neutral-200 p-4 dark:border-neutral-700">
                <h3 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Geometries
                </h3>
                <GeometryList onPanToFeature={panToFeature} />
            </div>
            <ConversionArea />
        </div>
    );
}
