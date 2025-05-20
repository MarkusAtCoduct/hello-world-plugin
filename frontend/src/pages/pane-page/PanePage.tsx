import { useState } from 'react';
import IErpPageProps from './IPanePageProps';

const ErpPage: React.FC<IErpPageProps> = ({ pluginBridge }) => {
  const [customer, setCustomer] = useState<string | null>(null);

  pluginBridge.subscribe('CustomerChanged', (data: unknown) => {
    setCustomer(data.customerId);
  });

  const handleGetCurrentCustomer = () => {
    pluginBridge.callMethod("getCurrentCustomerId").then((customerId: string) => {
      setCustomer(customerId);
    });
  };

  return (
    <div>
      <h1>PANE APP</h1>
      <div>{customer}</div>
      <button onClick={handleGetCurrentCustomer}>Get Current Customer</button>
    </div>
  );
};

export default ErpPage;
