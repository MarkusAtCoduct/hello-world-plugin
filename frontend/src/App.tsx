import { createPluginBridge, PluginBridge } from '@jtl-software/platform-plugins-core';
import { useEffect, useState } from 'react';
import './App.css';
import { ErpPage, SetupPage } from './pages';
import { PanePage } from './pages/pane-page';

type AppMode = 'setup' | 'erp' | 'pane';

const App: React.FC = () => {
  const mode: AppMode = location.pathname.substring(1) as AppMode;
  const [pluginBridge, setPluginBridge] = useState<PluginBridge | undefined>(undefined);

  useEffect((): void => {
    console.log('[HelloWorldPlugin] createPluginBridge...');
    createPluginBridge().then(bridge => {
      console.log('[HelloWorldPlugin] bridge created!');
      bridge.callMethod('test', 'Hello, world!');
      bridge.callMethod('test2', 'Hello, world!', 53);
      setPluginBridge(bridge);
    });
  }, []);

  switch (mode) {
    case 'setup':
      return pluginBridge && <SetupPage pluginBridge={pluginBridge} />;
    case 'erp':
      return pluginBridge && <ErpPage pluginBridge={pluginBridge} />;
    case 'pane':
      return pluginBridge && <PanePage pluginBridge={pluginBridge} />;
    default:
      return (
        <div>
          <h1>Unknown mode</h1>
          <p>Unknown mode</p>
        </div>
      );
  }
};

export default App;
