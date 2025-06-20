import { useCallback, useState } from 'react';
import ISetupPageProps from './ISetupPageProps';
import {
  Box,
  Button,
  Stack,
  Text,
  Card,
  Skeleton, // Using Skeleton for loading indication
  Alert,    // Using Alert for error display
} from '@jtl-software/platform-ui-react';

const SetupPage: React.FC<ISetupPageProps> = ({ pluginBridge }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetupCompleted = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const sessionToken = await pluginBridge.callMethod<string>('getSessionToken');

      const response = await fetch('http://localhost:50143/connect-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken,
        }),
      });

      const responseBody = await response.text();
      console.log('Response from backend:', response.status, responseBody);

      if (response.ok) {
        await pluginBridge.callMethod('setupCompleted');
      } else {
        let backendError = `Request failed with status ${response.status}`;
        try {
            const jsonError = JSON.parse(responseBody);
            backendError = jsonError.message || jsonError.error || responseBody;
        } catch (parseError) {
            // responseBody is not JSON or doesn't have a clear error message
            backendError = responseBody || backendError;
        }
        setError(`Failed to connect tenant: ${backendError}`);
      }
    } catch (e) {
      console.error('Error during setup:', e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred during setup.');
    } finally {
      setIsLoading(false);
    }
  }, [pluginBridge]);

  if (isLoading) {
    return (
      <Box className="flex flex-col items-center justify-center h-screen p-4">
        <Stack spacing="4" className="items-center"> {/* Assuming Stack has spacing or use Tailwind gap */}
          {/* Using multiple Skeleton elements to represent a loading UI */}
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-8 w-48 mt-4" />
          <Skeleton className="h-4 w-64 mt-2" />
          <Text variant="lead" className="mt-4">Loading...</Text>
          <Text>Please wait while we are setting up your plugin.</Text>
        </Stack>
      </Box>
    );
  }

  return (
    <Box className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-md p-6 md:p-8"> {/* Responsive width and padding */}
        <Stack spacing="6" className="items-center"> {/* Tailwind gap-6 */}
          <Text variant="heading1" as="h1">Plugin Setup</Text>
          <Text className="text-center text-gray-700 dark:text-gray-300">
            Here a login flow could be performed. Once authenticated, you can connect your JTL Cloud Tenant.
          </Text>

          {error && (
            // Assuming Alert component has 'variant' and takes children
            <Alert variant="destructive" className="w-full">
              {/* <Alert.Title>Setup Error</Alert.Title> // If Alert has sub-components */}
              <Text>{error}</Text>
            </Alert>
          )}

          <Button
            onClick={handleSetupCompleted}
            variant="primary"
            size="lg" // Assuming 'lg' is a valid size
            className="w-full mt-2" // Ensure button takes full width
          >
            Connect now with JTL Cloud Tenant
          </Button>
        </Stack>
      </Card>
    </Box>
  );
};

export default SetupPage;
