// Error Boundary - Componente para capturar y manejar errores de renderizado
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log del error para debugging
    console.error('Error capturado por Error Boundary:', error);
    console.error('Component Stack:', errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[200px] flex items-center justify-center bg-red-50 border-2 border-red-300 rounded-lg m-4">
          <div className="text-center max-w-md p-6">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Algo salió mal</h2>
            <p className="text-gray-700 mb-4">
              Ocurrió un error al renderizar este componente. Por favor, intenta nuevamente.
            </p>
            
            {this.props.showDetails && this.state.error && (
              <details className="text-left mb-4 bg-white p-4 rounded border border-gray-300">
                <summary className="cursor-pointer font-semibold mb-2 text-gray-700">
                  Detalles técnicos (para desarrolladores)
                </summary>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
            
            <button 
              onClick={this.handleReset}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;











