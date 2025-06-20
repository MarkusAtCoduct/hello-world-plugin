import { createPluginBridge, PluginBridge } from '@jtl-software/platform-plugins-core';
import { useEffect, useState } from 'react';
import './App.css'; // Keep this for any global non-component styles
import { ErpPage, SetupPage } from './pages';
import { PanePage } from './pages/pane-page';
import { Box, Text, Stack, Alert, Skeleton, Button } from '@jtl-software/platform-ui-react';

type AppMode = 'setup' | 'erp' | 'pane' | '';

const App: React.FC = () => {
  const path = location.pathname.substring(1).split('/')[0];
  const mode: AppMode = path as AppMode;

  const [pluginBridge, setPluginBridge] = useState<PluginBridge | undefined>(undefined);
  const [bridgeError, setBridgeError] = useState<string | null>(null);

  useEffect((): void => {
    console.log('[HelloWorldPlugin] createPluginBridge...');
    createPluginBridge()
      .then(bridge => {
        console.log('[HelloWorldPlugin] bridge created!');
        setPluginBridge(bridge);
      })
      .catch(error => {
        console.error('[HelloWorldPlugin] Failed to create plugin bridge:', error);
        setBridgeError(error instanceof Error ? error.message : 'Failed to initialize plugin bridge.');
      });
  }, []);

  if (bridgeError) {
    return (
      <Box className="flex items-center justify-center h-screen p-4">
        <Alert variant="destructive" className="w-full max-w-lg">
          {/* Assuming Alert can take a title, or we use Text for it */}
          <Text variant="heading3" as="h3" className="mb-2">Initialization Error</Text>
          <Text>{bridgeError}</Text>
          <Text className="mt-2">Please ensure the plugin environment is correctly configured and try reloading.</Text>
        </Alert>
      </Box>
    );
  }

  if (!pluginBridge) {
    return (
      <Box className="flex flex-col items-center justify-center h-screen p-4">
        <Stack spacing="4" className="items-center">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-8 w-56 mt-4" />
          <Text variant="lead" className="mt-4">Initializing Plugin...</Text>
        </Stack>
      </Box>
    );
  }

  switch (mode) {
    case 'setup':
      return <SetupPage pluginBridge={pluginBridge} />;
    case 'erp':
      return <ErpPage pluginBridge={pluginBridge} />;
    case 'pane':
      return <PanePage pluginBridge={pluginBridge} />;
    default:
      return (
        <Box className="flex items-center justify-center h-screen p-4 text-center">
          <Stack spacing="4" className="items-center">
            <Text variant="heading1" as="h1">Oops! Page Not Found</Text>
            <Text variant="lead">
              The page you are looking for ({mode ? `"${mode}"` : 'root path'}) does not exist or is not recognized.
            </Text>
            <Text>Please check the URL or navigate using the application.</Text>
            {/* Optional: Button to navigate to a default/home page */}
            <Button variant="secondary" onClick={() => location.href = '/setup'} className="mt-4">
              Go to Setup Page
            </Button>
          </Stack>
        </Box>
      );
  }
};

export default App;
