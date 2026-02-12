import React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || "Unknown render error" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    this.props.onError?.(error, info);
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-grid flex items-center justify-center p-6">
          <div className="glass-card max-w-lg w-full p-6 space-y-4">
            <h1 className="text-xl font-bold neon-text-red">Something went wrong</h1>
            <p className="text-sm text-cyan-200/70">{this.state.errorMessage}</p>
            <div className="flex gap-2">
              <button className="btn-cyber" onClick={this.handleRetry}>Retry</button>
              <button className="btn-ghost" onClick={() => window.location.reload()}>Reload App</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
