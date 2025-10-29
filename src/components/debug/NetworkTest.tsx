import { useState, useEffect } from "react";
import { API_BASE } from "@/config/api";

export const NetworkTest = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const tests = [
      {
        name: "API Health Check",
        url: `${API_BASE.replace('/api', '')}/api/health`,
        method: "GET"
      },
      {
        name: "Login Test",
        url: `${API_BASE}/login`,
        method: "POST",
        body: JSON.stringify({ email: "test@lager.de", passwort: "123456" })
      }
    ];

    const results = [];

    for (const test of tests) {
      try {
        console.log(`🧪 Running test: ${test.name}`);
        console.log(`🔗 URL: ${test.url}`);
        
        const response = await fetch(test.url, {
          method: test.method,
          headers: {
            "Content-Type": "application/json",
          },
          body: test.body
        });

        const data = await response.json();
        
        results.push({
          name: test.name,
          status: response.ok ? "✅ Success" : "❌ Failed",
          statusCode: response.status,
          data: data,
          error: null
        });
        
        console.log(`✅ ${test.name}:`, data);
      } catch (error) {
        results.push({
          name: test.name,
          status: "❌ Error",
          statusCode: null,
          data: null,
          error: error.message
        });
        
        console.error(`❌ ${test.name}:`, error);
      }
    }

    setTestResults(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔧 Network Debug Test</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">📍 Current Environment</h2>
        <div className="bg-muted p-4 rounded-lg">
          <p><strong>Hostname:</strong> {window.location.hostname}</p>
          <p><strong>Port:</strong> {window.location.port}</p>
          <p><strong>Protocol:</strong> {window.location.protocol}</p>
          <p><strong>Full URL:</strong> {window.location.href}</p>
          <p><strong>API Base:</strong> {API_BASE}</p>
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={runTests}
          disabled={isRunning}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
        >
          {isRunning ? "Running Tests..." : "Run Tests Again"}
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">🧪 Test Results</h2>
        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{result.name}</h3>
                <span className={`px-2 py-1 rounded text-sm ${
                  result.status.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {result.status}
                </span>
              </div>
              
              {result.statusCode && (
                <p><strong>Status Code:</strong> {result.statusCode}</p>
              )}
              
              {result.data && (
                <div>
                  <p><strong>Response Data:</strong></p>
                  <pre className="bg-muted p-2 rounded text-sm overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.error && (
                <div>
                  <p><strong>Error:</strong></p>
                  <p className="text-red-600">{result.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
