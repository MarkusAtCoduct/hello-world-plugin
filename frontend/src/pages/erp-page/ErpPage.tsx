import {
  Button,
  Input,
  Stack,
  Text,
  Tooltip,
} from "@jtl-software/platform-ui-react";
import { useCallback, useState } from "react";
import IErpPageProps from "./IErpPageProps";

interface JwtPayload {
  tenantId: string;
  userId?: string;
  kId?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  aud?: string;
}
interface DecodedJwt {
  header: {
    alg: string;
    typ: string;
    [key: string]: unknown;
  };
  payload: JwtPayload;
  signature: string;
}

function decodeJwtPart<T>(part: string): T {
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );
  const json = atob(padded);
  return JSON.parse(json);
}
function decodeJwt(token: string): DecodedJwt {
  const [header, payload, signature] = token.split(".");

  const decodedHeader = decodeJwtPart<DecodedJwt["header"]>(header);
  const decodedPayload = decodeJwtPart<JwtPayload>(payload);

  return {
    header: decodedHeader,
    payload: decodedPayload,
    signature: signature,
  };
}

const ErpPage: React.FC<IErpPageProps> = ({ appBridge }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const [erpInfo, setErpInfo] = useState<null>(null);
  const [erpInfoError, setErpInfoError] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string>("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<string>("");
  const [httpMethod, setHttpMethod] = useState<string>("GET");
  const [requestBody, setRequestBody] = useState<string>("{}");

  const handleRequestTimestampPress = useCallback(async (): Promise<void> => {
    try {
      setIsRequesting(true);
      const time = await appBridge.method.call<Date>("getCurrentTime");

      setTime(`${typeof time} ${time.toUTCString()}`);
    } finally {
      setIsRequesting(false);
    }
  }, [appBridge]);


  const handleRequestTest = async (): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:50143/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _tenantId: tenantId,
          _endpoint: endpoint || "",
          _httpMethod: httpMethod,
          _requestBody: requestBody,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Test Request Data:", data);
    } catch (error) {
      console.error("Failed to make test request:", error);
    }
  };

  const fetchSessionToken = useCallback(async (): Promise<void> => {
    try {
      setIsRequesting(true);
      appBridge.method.isExposed("getSessionToken");
      const encoded = await appBridge.method.call<string>("getSessionToken");
      setSessionToken(encoded);

      console.log("Session Token:", encoded);

      // Decode token to extract tenant ID
      const decoded = decodeJwt(encoded);
      console.log("Decoded Token:", decoded);
      if (decoded.payload && decoded.payload.tenantId) {
        setTenantId(decoded.payload.tenantId);
      }
    } catch (error) {
      console.error("Failed to fetch session token:", error);
      setErpInfoError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRequesting(false);
    }
  }, [appBridge]);

  const handleFetchErpInfo = useCallback(async (): Promise<void> => {
    if (!tenantId) {
      setErpInfoError("Please enter a tenant ID");
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
          "Content-Type": "application/json",
        },
      };

      // Add body for methods that support it
      if (["POST", "PUT", "PATCH"].includes(httpMethod)) {
        try {
          // Parse the existing request body
          let bodyObj = JSON.parse(requestBody);

          // Add tenantId and endpoint to the body
          bodyObj = {
            ...bodyObj,
            _tenantId: tenantId,
            _endpoint: endpoint || "",
          };

          // Convert back to JSON string
          options.body = JSON.stringify(bodyObj);
        } catch (e) {
          throw new Error(`Invalid JSON in request body: ${e}`);
        }
      } else if (httpMethod === "GET" || httpMethod === "DELETE") {
        // For GET and DELETE, we can't include a body
        // The tenantId and endpoint are already in the URL
      }

      const response = await fetch(url, options);
      console.log("Response:", response);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("ERP Info:", data);
      setErpInfo(data);
    } catch (error) {
      console.log("Failed to fetch ERP info:", error);
      setErpInfoError(error instanceof Error ? error.message : String(error));
      setErpInfo(null);
    } finally {
      setIsRequesting(false);
    }
  }, [tenantId, endpoint, httpMethod, requestBody]);

  return (
    <Stack direction="column" spacing="4">
      <Text type="h1" align="center">{`ERP Page`}</Text>

      <Stack spacing="4" direction="column">
        <Text type="h2" align="center">
          Request Current Time
        </Text>
        <div>
          <Button
            loading={isRequesting}
            label="Request time now"
            onClick={handleRequestTimestampPress}
            variant="outline"
            icon="Timer"
          />
        </div>
        <Text type="h3" align="center">
          {time}
        </Text>
      </Stack>

      <Stack spacing="6" direction="column">
        <Text align="center" type="h2">
          Request ERP Info
        </Text>
        <div>
          <Stack
            direction="row"
            spacing="4"
            itemAlign="center"
            justify="center"
          >
            <Stack direction="row" spacing="2" itemAlign="end" justify="center">
              <Input
                label="Tenant ID"
                type="text"
                placeholder="Enter Tenant ID"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              />
              <Tooltip content="get Tenant ID">
                <Button
                  variant="highlight"
                  icon="IdCard"
                  onClick={fetchSessionToken}
                  disabled={isRequesting}
                />
              </Tooltip>
            </Stack>
            <Input
              label="Endpoint"
              type="text"
              placeholder="Enter Endpoint (optional)"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
            <select
              value={httpMethod}
              onChange={(e) => setHttpMethod(e.target.value)}
              style={{ padding: "8px", marginRight: "10px" }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
            <Button
              onClick={handleFetchErpInfo}
              loading={isRequesting}
              variant="secondary"
              label="Fetch ERP Info"
            />
            <Button
              onClick={handleRequestTest}
              loading={isRequesting}
              variant="secondary"
              label="Test Request"
            />
          </Stack>
          {["POST", "PUT", "PATCH"].includes(httpMethod) && (
            <div style={{ margin: "10px 0" }}>
              <h4>Request Body (JSON):</h4>
              <p style={{ fontSize: "12px", color: "#666" }}>
                Note: tenantId and endpoint will be automatically added to the
                request body with keys _tenantId and _endpoint
              </p>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                style={{
                  width: "100%",
                  height: "100px",
                  padding: "8px",
                  fontFamily: "monospace",
                }}
              />
            </div>
          )}
        </div>

        {sessionToken && (
          <div style={{ margin: "10px 0", fontSize: "12px" }}>
            <p>
              <strong>Session Token:</strong> {sessionToken.substring(0, 20)}...
            </p>
            <p>
              <strong>Extracted Tenant ID:</strong> {tenantId}
            </p>
          </div>
        )}
        {erpInfoError && <p style={{ color: "red" }}>Error: {erpInfoError}</p>}

        {erpInfo && (
          <div style={{ marginTop: "20px" }}>
            <h3>ERP Information:</h3>
            <pre
              style={{
                background: "#f4f4f4",
                padding: "10px",
                borderRadius: "4px",
              }}
            >
              {JSON.stringify(erpInfo, null, 2)}
            </pre>
          </div>
        )}
      </Stack>
    </Stack>
  );
};

export default ErpPage;
