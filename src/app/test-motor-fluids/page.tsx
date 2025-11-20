'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestMotorFluidsPage() {
    const [testUrl, setTestUrl] = useState('https://api.motor.com/v1/Information/Vehicles/Attributes/BaseVehicleID/20969/Content/Summaries/Of/DiagnosticTroubleCodes?ContentSilos=15&CO=1&EN=3464&SM=345&AttributeStandard=MOTOR');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [rawResponse, setRawResponse] = useState<string>('');
    const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});

    const handleTest = async () => {
        setLoading(true);
        setError(null);
        setResponse(null);
        setRawResponse('');
        setResponseHeaders({});

        try {
            const apiResponse = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            // Capture response headers
            const headers: Record<string, string> = {};
            apiResponse.headers.forEach((value, key) => {
                headers[key] = value;
            });
            setResponseHeaders(headers);

            // Parse response
            const contentType = apiResponse.headers.get('content-type');
            let data: any;

            if (contentType?.includes('application/json')) {
                data = await apiResponse.json();
            } else if (contentType?.includes('application/xml') || contentType?.includes('text/xml')) {
                // Parse XML response
                const xmlText = await apiResponse.text();
                data = {
                    xml: xmlText,
                    status: apiResponse.status,
                    statusText: apiResponse.statusText
                };
            } else {
                const text = await apiResponse.text();
                data = {
                    text: text,
                    status: apiResponse.status,
                    statusText: apiResponse.statusText
                };
            }

            if (apiResponse.ok) {
                setResponse(data);
                setRawResponse(JSON.stringify(data, null, 2));
            } else {
                setError(`${apiResponse.status} ${apiResponse.statusText}`);
                setRawResponse(JSON.stringify(data, null, 2));
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
            setRawResponse(JSON.stringify(err, null, 2));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    MOTOR DaaS - Diagnostic Trouble Codes API Tester
                </h1>

                {/* Input Form */}
                <div className="bg-white dark:bg-[#131313] rounded-lg border border-gray-200 dark:border-[#222222] p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Test MOTOR DaaS Diagnostic Trouble Codes API
                    </h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            API URL (with authentication)
                        </label>
                        <textarea
                            value={testUrl}
                            onChange={(e) => setTestUrl(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white font-mono text-sm"
                            rows={3}
                            placeholder="https://api.motor.com/v1/..."
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Paste the full URL with authentication parameters
                        </p>
                    </div>

                    <Button
                        onClick={handleTest}
                        disabled={loading || !testUrl}
                        className="w-full"
                    >
                        {loading ? 'Testing...' : 'Test API URL'}
                    </Button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
                            Error
                        </h3>
                        <p className="text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Response Headers */}
                {Object.keys(responseHeaders).length > 0 && (
                    <div className="bg-white dark:bg-[#131313] rounded-lg border border-gray-200 dark:border-[#222222] p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Response Headers
                        </h2>
                        <div className="space-y-2">
                            {Object.entries(responseHeaders).map(([key, value]) => (
                                <div key={key} className="flex gap-4 text-sm">
                                    <div className="font-mono font-semibold text-gray-700 dark:text-gray-300 w-48">
                                        {key}:
                                    </div>
                                    <div className="font-mono text-gray-900 dark:text-white flex-1 break-all">
                                        {value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Response Display */}
                {response && (
                    <div className="bg-white dark:bg-[#131313] rounded-lg border border-gray-200 dark:border-[#222222] p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            API Response
                        </h2>

                        {/* XML Response */}
                        {response.xml && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    XML Response
                                </h3>
                                <pre className="bg-gray-900 dark:bg-black text-green-400 p-4 rounded-md overflow-auto text-xs">
                                    {response.xml}
                                </pre>
                            </div>
                        )}

                        {/* Parsed JSON Response */}
                        {response.Body && (
                            <>
                                {/* Summary */}
                                <div className="mb-4 p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-md">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                                            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                                {response.Header?.Status || 'OK'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Status Code</div>
                                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {response.Header?.StatusCode || '200'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Total Applications</div>
                                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {response.Body?.Applications?.length || response.Header?.PagingInfo?.TotalItemCount || 0}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Applications List */}
                                {response.Body?.Applications && response.Body.Applications.length > 0 ? (
                                    <div className="space-y-4 mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Fluid Applications ({response.Body.Applications.length})
                                        </h3>
                                        {response.Body.Applications.map((app: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-4 bg-gray-50 dark:bg-[#1a1a1a]"
                                            >
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">Display Name</div>
                                                        <div className="font-semibold text-gray-900 dark:text-white">
                                                            {app.DisplayName || 'N/A'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">Is Active</div>
                                                        <div className="text-gray-900 dark:text-white">
                                                            {app.IsActive ? 'Yes' : 'No (Superseded)'}
                                                        </div>
                                                    </div>
                                                    {app.Position && (
                                                        <>
                                                            <div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">Position Name</div>
                                                                <div className="text-gray-900 dark:text-white">
                                                                    {app.Position.Name || 'N/A'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">Position ID</div>
                                                                <div className="text-gray-900 dark:text-white">
                                                                    {app.Position.PositionID || 'N/A'}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                    {app.Taxonomy && (
                                                        <>
                                                            <div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">Common Name</div>
                                                                <div className="text-gray-900 dark:text-white">
                                                                    {app.Taxonomy.CommonName || 'N/A'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">Literal Name</div>
                                                                <div className="text-gray-900 dark:text-white">
                                                                    {app.Taxonomy.LiteralName || 'N/A'}
                                                                </div>
                                                            </div>
                                                            {app.Taxonomy.SystemName && (
                                                                <div>
                                                                    <div className="text-sm text-gray-500 dark:text-gray-400">System</div>
                                                                    <div className="text-gray-900 dark:text-white">
                                                                        {app.Taxonomy.SystemName}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                {app.Qualifiers && app.Qualifiers.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#2a2a2a]">
                                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Qualifiers:
                                                        </div>
                                                        <div className="space-y-1">
                                                            {app.Qualifiers.map((q: any, qIdx: number) => (
                                                                <div key={qIdx} className="text-xs text-gray-600 dark:text-gray-400">
                                                                    • {q.Description} {q.IsActive ? '' : '(Inactive)'}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                                        <p className="text-yellow-800 dark:text-yellow-400">
                                            No fluid applications found. Applications array is empty.
                                        </p>
                                        {response.Header?.PagingInfo && (
                                            <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-2">
                                                TotalItemCount: {response.Header.PagingInfo.TotalItemCount}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Raw JSON Response */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Raw JSON Response
                            </h3>
                            <pre className="bg-gray-900 dark:bg-black text-green-400 p-4 rounded-md overflow-auto text-xs">
                                {rawResponse}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

