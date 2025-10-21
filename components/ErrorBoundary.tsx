"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🔴 ErrorBoundary caught an error:", error);
    console.error("🔴 Error details:", errorInfo);
    console.error("🔴 Component stack:", errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/10 p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 border-2 border-red-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl">⚠️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
                  Something Went Wrong
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The application encountered an error
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Error Message:
                </h2>
                <pre className="bg-red-100 dark:bg-red-900/20 p-3 rounded text-sm overflow-x-auto text-red-800 dark:text-red-300">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}

            {this.state.error?.stack && (
              <div className="mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Stack Trace:
                </h2>
                <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto max-h-64 overflow-y-auto text-gray-800 dark:text-gray-300">
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            {this.state.errorInfo?.componentStack && (
              <div className="mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Component Stack:
                </h2>
                <pre className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded text-xs overflow-x-auto max-h-64 overflow-y-auto text-blue-800 dark:text-blue-300">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

