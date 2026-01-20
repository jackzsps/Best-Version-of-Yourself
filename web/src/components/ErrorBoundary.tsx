import React, { ReactNode } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import Button from './Button'; // Assuming a generic Button component exists

// --- Fallback Component ---
// This component is displayed when an error is caught by the ErrorBoundary.

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  // It's good practice to log the error to an external service
  console.error("Caught by ErrorBoundary:", error);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-8 text-center" role="alert">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Something went wrong.</h1>
      <p className="text-gray-700 mb-6 max-w-lg">
        We've encountered an unexpected issue. Please try refreshing the page.
      </p>
      
      {/* Displaying error details can be helpful in development */}
      <details className="w-full max-w-lg bg-gray-100 p-4 rounded-lg mb-6 text-left">
          <summary className="font-medium text-gray-600 cursor-pointer">Error Details</summary>
          <pre className="mt-4 text-xs text-gray-500 overflow-auto whitespace-pre-wrap">
              {error.message}
              {'\n\n'}
              {error.stack}
          </pre>
      </details>

      <Button 
        onClick={resetErrorBoundary} 
        variant="primary"
      >
        Reload Page
      </Button>
    </div>
  );
};

// --- Main Error Boundary Wrapper ---
// This component wraps parts of the application that might throw errors.

interface AppErrorBoundaryProps {
  children: ReactNode;
}

const AppErrorBoundary: React.FC<AppErrorBoundaryProps> = ({ children }) => {
  const handleReset = () => {
    // This function is called when the reset button in the fallback is clicked.
    // For a simple reset, reloading the page is a straightforward solution.
    window.location.reload();
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={handleReset}
    >
      {children}
    </ErrorBoundary>
  );
};

export default AppErrorBoundary;
