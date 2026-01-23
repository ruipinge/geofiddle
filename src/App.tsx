import { AppShell } from '@/components/layout/AppShell';
import { useGeometryParsing } from '@/hooks/useGeometryParsing';
import { useDeepLink } from '@/hooks/useDeepLink';

export default function App() {
    // Set up URL deep-linking (load from URL, sync to URL)
    useDeepLink();

    // Set up automatic geometry parsing
    useGeometryParsing();

    return <AppShell />;
}
