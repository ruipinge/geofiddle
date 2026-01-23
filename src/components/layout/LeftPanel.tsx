import { InputArea } from '@/components/input/InputArea';
import { ConversionArea } from '@/components/conversion/ConversionArea';

export function LeftPanel() {
    return (
        <div className="flex h-full flex-col overflow-y-auto bg-neutral-50 dark:bg-neutral-900">
            <InputArea />
            <ConversionArea />
        </div>
    );
}
