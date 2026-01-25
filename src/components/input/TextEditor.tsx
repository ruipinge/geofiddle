import { useCallback, type ChangeEvent, type DragEvent } from 'react';

interface TextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function TextEditor({ value, onChange, placeholder }: TextEditorProps) {
    const handleChange = useCallback(
        (e: ChangeEvent<HTMLTextAreaElement>) => {
            onChange(e.target.value);
        },
        [onChange]
    );

    const handleDrop = useCallback(
        (e: DragEvent<HTMLTextAreaElement>) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = event.target?.result;
                    if (typeof content === 'string') {
                        onChange(content);
                    }
                };
                reader.readAsText(file);
            }
        },
        [onChange]
    );

    const handleDragOver = useCallback((e: DragEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
    }, []);

    return (
        <textarea
            value={value}
            onChange={handleChange}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            placeholder={placeholder}
            aria-label="Geometry input"
            className="h-48 w-full resize-none rounded-md border border-neutral-300 bg-white p-3 font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            spellCheck={false}
        />
    );
}
