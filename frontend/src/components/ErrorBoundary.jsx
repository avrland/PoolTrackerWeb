import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-message" role="alert">
          <strong>Błąd ładowania danych.</strong>{' '}
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Odśwież
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
