 
import { Button } from '@jtl-software/platform-ui-react';
import { useCallback, useState } from 'react';
import IErpPageProps from './IErpPageProps';

function decodeJwtPart(part: string): any {
  // Base64URL → Base64
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

  // Dekodieren
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
    signature: signature, // Nicht decodierbar ohne Key
  };
}

const ErpPage: React.FC<IErpPageProps> = ({ pluginBridge }) => {
  const [isRequesting, setIsRequesting] = useState(false);
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
      setIsRequesting(true);
      const time = await pluginBridge.callMethod<Date>('getCurrentTime');

      setTime(`${typeof time} ${time.toUTCString()}`);
    } finally {
      setIsRequesting(false);
    }
  }, [pluginBridge]);

  const fetchSessionToken = useCallback(async (): Promise<void> => {
    try {
      setIsRequesting(true);
      const encoded = await pluginBridge.callMethod<string>('getSessionToken');
      setSessionToken(encoded);

      console.log('Session Token:', encoded);

      // Decode token to extract tenant ID
      const decoded = decodeJwt(encoded);
      console.log('Decoded Token:', decoded);
      if (decoded.payload && decoded.payload.tenantId) {
        setTenantId(decoded.payload.tenantId);
      }
    } catch (error) {
      console.error('Failed to fetch session token:', error);
      setErpInfoError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRequesting(false);
    }
  }, [pluginBridge]);

  const handleFetchErpInfo = useCallback(async (): Promise<void> => {
    if (!tenantId) {
      setErpInfoError('Please enter a tenant ID');
      return;
    }

    try {
      setIsRequesting(true);
      setErpInfoError(null);

      // Construct URL with endpoint if provided
      const url = endpoint 
        ? `http://localhost:50143/erp-info/${tenantId}/${endpoint}`
        : `http://localhost:50143/erp-info/${tenantId}`;

      // Create fetch options with selected method
      const options: RequestInit = {
        method: httpMethod,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // Add body for methods that support it
      if (['POST', 'PUT', 'PATCH'].includes(httpMethod)) {
        try {
          // Parse the existing request body
          let bodyObj = JSON.parse(requestBody);
          
          // Add tenantId and endpoint to the body
          bodyObj = {
            ...bodyObj,
            _tenantId: tenantId,
            _endpoint: endpoint || ''
          };
          
          // Convert back to JSON string
          options.body = JSON.stringify(bodyObj);
        } catch (e) {
          throw new Error('Invalid JSON in request body');
        }
      } else if (httpMethod === 'GET' || httpMethod === 'DELETE') {
        // For GET and DELETE, we can't include a body
        // The tenantId and endpoint are already in the URL
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
      setIsRequesting(false);
    }
  }, [tenantId, endpoint, httpMethod, requestBody]);

  return (
    <div>
      <h1>{`ERP ${view}`}</h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>Request Current Time</h2>
        <button onClick={handleRequestTimestampPress}>Request time now</button>
        {isRequesting && <p>Requesting...</p>}
        <h3>{time}</h3>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>Request ERP Info</h2>
        <div>
          <Button label='Get Tenant ID from Session' variant='highlight'  onClick={fetchSessionToken} disabled={isRequesting} />
            
          <div style={{ margin: '10px 0' }}>
            <input
              type="text"
              placeholder="Enter Tenant ID"
              value={tenantId}
              onChange={e => setTenantId(e.target.value)}
              style={{ padding: '8px', marginRight: '10px' }}
            />
            <input
              type="text"
              placeholder="Enter Endpoint (optional)"
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              style={{ padding: '8px', marginRight: '10px' }}
            />
            <select
              value={httpMethod}
              onChange={e => setHttpMethod(e.target.value)}
              style={{ padding: '8px', marginRight: '10px' }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
            <button onClick={handleFetchErpInfo} disabled={isRequesting}>
              Fetch ERP Info
            </button>
          </div>
          
          {/* Request body input for POST, PUT, PATCH methods */}
          {['POST', 'PUT', 'PATCH'].includes(httpMethod) && (
            <div style={{ margin: '10px 0' }}>
              <h4>Request Body (JSON):</h4>
              <p style={{ fontSize: '12px', color: '#666' }}>
                Note: tenantId and endpoint will be automatically added to the request body with keys _tenantId and _endpoint
              </p>
              <textarea
                value={requestBody}
                onChange={e => setRequestBody(e.target.value)}
                style={{ width: '100%', height: '100px', padding: '8px', fontFamily: 'monospace' }}
              />
            </div>
          )}
        </div>

        {sessionToken && (
          <div style={{ margin: '10px 0', fontSize: '12px' }}>
            <p>
              <strong>Session Token:</strong> {sessionToken.substring(0, 20)}...
            </p>
            <p>
              <strong>Extracted Tenant ID:</strong> {tenantId}
            </p>
          </div>
        )}

        {isRequesting && <p>Requesting...</p>}
        {erpInfoError && <p style={{ color: 'red' }}>Error: {erpInfoError}</p>}

        {erpInfo && (
          <div style={{ marginTop: '20px' }}>
            <h3>ERP Information:</h3>
            <pre style={{ background: '#f4f4f4', padding: '10px', borderRadius: '4px' }}>{JSON.stringify(erpInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErpPage;