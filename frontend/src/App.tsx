import { AppBridge, createAppBridge } from '@jtl-software/cloud-apps-core';
import { useEffect, useState } from 'react';
import './App.css';
import { ErpPage, SetupPage } from './pages';
import { PanePage } from './pages/pane-page';

type AppMode = 'setup' | 'erp' | 'pane';

const App: React.FC = () => {
  const mode: AppMode = location.pathname.substring(1) as AppMode;
  const [appBridge, setAppBridge] = useState<AppBridge | undefined>(undefined);

  useEffect((): void => {
    console.log('[HelloWorldApp] createAppBridge...');
    createAppBridge().then(bridge => {
      console.log('[HelloWorldApp] bridge created!');
      bridge.method.call('test', 'Hello, world!');
      bridge.method.call('test2', 'Hello, world!', 53);
      setAppBridge(bridge);
    });
  }, []);

  switch (mode) {
    case 'setup':
      return appBridge && <SetupPage appBridge={appBridge} />;
    case 'erp':
      return appBridge && <ErpPage appBridge={appBridge} />;
    case 'pane':
      return appBridge && <PanePage appBridge={appBridge} />;
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
