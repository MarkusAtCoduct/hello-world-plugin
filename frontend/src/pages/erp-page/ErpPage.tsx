import { useCallback, useState } from 'react';
import IErpPageProps from './IErpPageProps';
import {
  Box,
  Button, // Already used, keep as is
  Card,
  Input,
  Select, // Assuming SelectOption matches this structure or is adapted
  Stack,
  Text,
  Textarea, // Corrected casing from documentation (Textarea vs TextArea)
  // Title, // Using Text with variant/size prop instead if Title is not a separate component
  Skeleton, // Using Skeleton for loading states as Spinner wasn't explicitly listed
} from '@jtl-software/platform-ui-react';

// Assuming SelectOption might be a sub-component or a type for the options prop
// For now, we'll define a simple structure for options if not directly provided by the library.
interface SelectOption {
  label: string;
  value: string;
}

function decodeJwtPart(part: string): any {
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const json = atob(padded);
  return JSON.parse(json);
}

function decodeJwt(token: string) {
  const [header, payload, signature] = token.split('.');
  const decodedHeader = decodeJwtPart(header);
  const decodedPayload = decodeJwtPart(payload);
  return {
    header: decodedHeader,
    payload: decodedPayload,
    signature: signature,
  };
}

const ErpPage: React.FC<IErpPageProps> = ({ pluginBridge }) => {
  const [isRequestingTime, setIsRequestingTime] = useState(false);
  const [isRequestingErpInfo, setIsRequestingErpInfo] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const [erpInfo, setErpInfo] = useState<any>(null);
  const [erpInfoError, setErpInfoError] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<string>('');
  const [httpMethod, setHttpMethod] = useState<string>('GET');
  const [requestBody, setRequestBody] = useState<string>('{}');
  const view = new URLSearchParams(window.location.search).get('view');

  const handleRequestTimestampPress = useCallback(async (): Promise<void> => {
    try {
      setIsRequestingTime(true);
      const fetchedTime = await pluginBridge.callMethod<Date>('getCurrentTime');
      setTime(`${typeof fetchedTime} ${fetchedTime.toUTCString()}`);
    } finally {
      setIsRequestingTime(false);
    }
  }, [pluginBridge]);

  const fetchSessionToken = useCallback(async (): Promise<void> => {
    try {
      setIsRequestingErpInfo(true);
      const encoded = await pluginBridge.callMethod<string>('getSessionToken');
      setSessionToken(encoded);
      console.log('Session Token:', encoded);
      const decoded = decodeJwt(encoded);
      console.log('Decoded Token:', decoded);
      if (decoded.payload && decoded.payload.tenantId) {
        setTenantId(decoded.payload.tenantId);
      }
    } catch (error) {
      console.error('Failed to fetch session token:', error);
      setErpInfoError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRequestingErpInfo(false);
    }
  }, [pluginBridge]);

  const handleFetchErpInfo = useCallback(async (): Promise<void> => {
    if (!tenantId) {
      setErpInfoError('Please enter a tenant ID');
      return;
    }

    try {
      setIsRequestingErpInfo(true);
      setErpInfoError(null);
      setErpInfo(null);

      const url = endpoint
        ? `http://localhost:50143/erp-info/${tenantId}/${endpoint}`
        : `http://localhost:50143/erp-info/${tenantId}`;

      const options: RequestInit = {
        method: httpMethod,
        headers: { 'Content-Type': 'application/json' },
      };

      if (['POST', 'PUT', 'PATCH'].includes(httpMethod)) {
        try {
          let bodyObj = JSON.parse(requestBody);
          bodyObj = { ...bodyObj, _tenantId: tenantId, _endpoint: endpoint || '' };
          options.body = JSON.stringify(bodyObj);
        } catch (e) {
          setErpInfoError('Invalid JSON in request body');
          setIsRequestingErpInfo(false);
          return;
        }
      }

      const response = await fetch(url, options);
      console.log('Response:', response);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('ERP Info:', data);
      setErpInfo(data);
    } catch (error) {
      console.log('Failed to fetch ERP info:', error);
      setErpInfoError(error instanceof Error ? error.message : String(error));
      setErpInfo(null);
    } finally {
      setIsRequestingErpInfo(false);
    }
  }, [tenantId, endpoint, httpMethod, requestBody]);

  const httpMethodOptions: SelectOption[] = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'DELETE', value: 'DELETE' },
    { label: 'PATCH', value: 'PATCH' },
  ];

  // Helper to render Skeleton loaders
  const renderSkeletonText = (width: string = "100px") => <Skeleton className={`h-4 w-[${width}]`} />;


  return (
    // Using Box for overall padding, assuming it has props like 'p' or 'padding' from Tailwind.
    // If not, Stack with gap might be better or direct Tailwind classes.
    // For now, assuming Box has a 'className' prop for Tailwind or specific spacing props.
    <Box className="p-4 md:p-6 lg:p-8">
      <Text variant="heading1" as="h1" className="mb-6">{`ERP ${view || 'View'}`}</Text>

      <Card className="mb-6">
        {/* Assuming Card has padding by default or accepts className for padding */}
        <Stack spacing="4" className="p-4">
          <Text variant="heading2" as="h2">Request Current Time</Text>
          <Button onClick={handleRequestTimestampPress} disabled={isRequestingTime} variant="primary">
            Request time now
          </Button>
          {isRequestingTime && <Skeleton className="h-8 w-32 mt-2" /> /* Placeholder for spinner/status */}
          {time && <Text variant="lead" className="mt-2">{time}</Text>}
        </Stack>
      </Card>

      <Card>
        <Stack spacing="4" className="p-4">
          <Text variant="heading2" as="h2">Request ERP Info</Text>

          <Button label="Get Tenant ID from Session" variant="secondary" onClick={fetchSessionToken} disabled={isRequestingErpInfo} />

          {/* Using Stack for form elements, assuming 'direction' and 'alignItems' or similar props */}
          <Stack direction="row" spacing="4" className="items-end flex-wrap">
            <Input
              label="Tenant ID"
              placeholder="Enter Tenant ID"
              value={tenantId}
              onChange={e => setTenantId(e.target.value)}
              disabled={isRequestingErpInfo}
              className="flex-grow"
            />
            <Input
              label="Endpoint (optional)"
              placeholder="Enter Endpoint"
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              disabled={isRequestingErpInfo}
              className="flex-grow"
            />
            {/* The Select component's props (options, onChange) are an assumption. */}
            {/* It might require children <Select.Option> or a different options structure. */}
            <Select
              label="HTTP Method"
              value={httpMethod}
              onValueChange={value => setHttpMethod(value || 'GET')} // Common pattern for shadcn/ui based libs
              disabled={isRequestingErpInfo}
              className="min-w-[120px]"
            >
              {httpMethodOptions.map(opt => (
                // Assuming Select takes options as children or has an 'options' prop
                // This is a common pattern for many libraries.
                // If it's like HTML select, it would be <option> tags.
                // If it's like shadcn/radix Select:
                // <Select.Trigger><Select.Value placeholder="Select method" /></Select.Trigger>
                // <Select.Content>{httpMethodOptions.map(o => <Select.Item value={o.value}>{o.label}</Select.Item>)}</Select.Content>
                // For now, assuming a simpler options prop or direct mapping if it's custom.
                // The provided docs were high-level. This is a best guess.
                // Let's assume it takes children for now as it's a common pattern for custom selects.
                // This part is highly speculative.
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Button onClick={handleFetchErpInfo} disabled={isRequestingErpInfo || !tenantId} variant="primary">
              Fetch ERP Info
            </Button>
          </Stack>

          {['POST', 'PUT', 'PATCH'].includes(httpMethod) && (
            <Stack spacing="2" className="mt-4">
              <Text variant="heading4" as="h4">Request Body (JSON):</Text>
              <Text size="sm" className="text-gray-600 dark:text-gray-400">
                Note: tenantId and endpoint will be automatically added to the request body with keys _tenantId and _endpoint
              </Text>
              <Textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                rows={5}
                disabled={isRequestingErpInfo}
                placeholder='{ "key": "value" }'
                className="font-mono"
              />
            </Stack>
          )}

          {sessionToken && (
            <Box className="mt-4 p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
              <Text size="sm" className="font-semibold">
                Session Token: <span className="font-normal">{sessionToken.substring(0, 30)}...</span>
              </Text>
              <Text size="sm" className="font-semibold">
                Extracted Tenant ID: <span className="font-normal">{tenantId}</span>
              </Text>
            </Box>
          )}
          <Box className="mt-2 min-h-[24px]"> {/* Box to prevent layout shift */}
            {isRequestingErpInfo && <Skeleton className="h-6 w-48" />}
            {erpInfoError && <Text className="text-red-600 dark:text-red-400">Error: {erpInfoError}</Text>}
          </Box>


          {erpInfo && (
            <Box className="mt-4">
              <Text variant="heading3" as="h3" className="mb-2">ERP Information:</Text>
              {/* For CodeBlock, using pre + Box as a fallback since CodeBlock component wasn't explicitly listed */}
              <Box as="pre" className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md overflow-x-auto text-sm">
                {JSON.stringify(erpInfo, null, 2)}
              </Box>
            </Box>
          )}
        </Stack>
      </Card>
    </Box>
  );
};

export default ErpPage;