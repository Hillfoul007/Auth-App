import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The application encountered an unexpected error. This might be
                  due to:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Backend server connection issues</li>
                    <li>Missing API endpoints</li>
                    <li>Network connectivity problems</li>
                    <li>Configuration errors</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {this.state.error && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-600 mb-2">
                    Error Details:
                  </h4>
                  <code className="text-sm text-red-800 block whitespace-pre-wrap">
                    {this.state.error.message}
                  </code>
                  {process.env.NODE_ENV === "development" &&
                    this.state.error.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium">
                          Stack Trace
                        </summary>
                        <pre className="text-xs mt-2 overflow-auto max-h-40 bg-white p-2 rounded border">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-semibold">Troubleshooting Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>Check if the backend server is running on port 3001</li>
                  <li>
                    Verify the health endpoint:{" "}
                    <code>http://localhost:3001/health</code>
                  </li>
                  <li>Check browser console for additional error details</li>
                  <li>Try refreshing the page</li>
                </ol>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Application
                </Button>

                <Button variant="outline" asChild>
                  <a
                    href="http://localhost:3001/health"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Check Backend
                  </a>
                </Button>
              </div>

              {process.env.NODE_ENV === "development" && (
                <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded">
                  <strong>Development Mode:</strong> This error boundary is
                  showing detailed information because you're in development
                  mode. In production, users would see a simpler error message.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
