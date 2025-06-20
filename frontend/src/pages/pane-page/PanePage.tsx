import { useState, useEffect, useCallback } from 'react';
import IPanePageProps from './IPanePageProps';
import { Box, Button, Stack, Text } from '@jtl-software/platform-ui-react';

const PanePage: React.FC<IPanePageProps> = ({ pluginBridge }) => {
  const [customer, setCustomer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = pluginBridge.subscribe('CustomerChanged', (data: any) => {
      if (data && typeof data.customerId === 'string') {
        setCustomer(data.customerId);
        setError(null); // Clear error if customer changes
      } else {
        console.warn('[PanePage] CustomerChanged event received without valid customerId:', data);
        // Optionally set an error or keep existing customer data
      }
    });

    return () => {
      if (unsubscribe && typeof unsubscribe.unsubscribe === 'function') {
        unsubscribe.unsubscribe();
      } else if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [pluginBridge]);

  const handleGetCurrentCustomer = useCallback(() => {
    setError(null); // Clear previous errors
    pluginBridge.callMethod<string>("getCurrentCustomerId")
      .then((customerId: string) => {
        if (customerId) {
          setCustomer(customerId);
        } else {
          // Handle case where customerId might be null or empty from a successful call
          setCustomer(null);
          // setError("No customer ID returned."); // Or some other appropriate message
        }
      })
      .catch(err => {
        console.error('[PanePage] Error calling getCurrentCustomerId:', err);
        setError(err instanceof Error ? err.message : "Failed to get current customer.");
        setCustomer(null);
      });
  }, [pluginBridge]);

  return (
    <Box className="p-4 md:p-6 text-center"> {/* Added text-center for Stack content */}
      <Stack spacing="4" className="items-center"> {/* Tailwind 'gap-4' equivalent for spacing */}
        <Text variant="heading1" as="h1">Pane App</Text>

        {error && (
          <Text className="text-red-600 dark:text-red-400 mt-2">Error: {error}</Text>
        )}

        {customer ? (
          <Text variant="lead" emphasis="bold" className="mt-2">Current Customer ID: {customer}</Text>
        ) : (
          !error && <Text className="mt-2">No customer selected or ID not available.</Text>
        )}

        <Button onClick={handleGetCurrentCustomer} variant="primary" className="mt-4">
          Get Current Customer
        </Button>
      </Stack>
    </Box>
  );
};

export default PanePage;
