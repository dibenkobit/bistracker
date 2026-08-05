import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Данные приезжают по сети, и сорваться может любой запрос. React ловит такое
 * только классовым компонентом - другого способа в нём до сих пор нет.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Оружейная упала:', error, info.componentStack)
  }

  override render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="boot boot--error" role="alert">
        <p className="boot__title">Не открылась</p>
        <p className="boot__hint">{error.message}</p>
        <button className="boot__retry" onClick={() => location.reload()}>
          Обновить страницу
        </button>
      </div>
    )
  }
}
