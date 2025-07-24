import { Button, Input, Stack, Text } from '@jtl-software/platform-ui-react';
import { useState } from 'react';
import IPanePageProps from './IPanePageProps';

const PanePage: React.FC<IPanePageProps> = ({ appBridge }) => {
  const [customer, setCustomer] = useState<string | undefined>(undefined);

  appBridge.event.subscribe('CustomerChanged', (data: unknown) => {
    return new Promise<void>((resolve) => {
      setCustomer((data as { customerId: string }).customerId);
      resolve();
    });
  });

  const handleGetCurrentCustomer = () => {
    appBridge.method.call("getCurrentCustomerId").then((customerId) => {
      setCustomer(customerId as string);
    });
  };

  return (
    <Stack spacing='4' direction='column'>
      <Text align='center' type='h2'>PANE APP</Text>
      <Input disabled value={customer} />
      <Button variant='outline' onClick={handleGetCurrentCustomer} label='Get Current Customer' />
    </Stack>
  );
};

export default PanePage;
