import * as React from 'react'
import { connect } from 'react-redux'
import { IMyWindow } from '../../redux/modules/interfaces'
import { IStore } from '../../redux/modules/reducer'
import LogViewer from './LogViewer'

// eslint-disable-next-line no-var
declare var window: IMyWindow

export interface IProps {}

export interface IStoreProps {}

export interface IDispatchProps {}

export interface IState {
  availableLogs: any | null
  currentFilename: string | null
}

const getAvailableLogFiles = async (): Promise<any> => {
  const { json } = await window.api.get('/0.1/logs_admin/available_logs/', null, {})
  return json
}

type TComponentProps = IProps & IStoreProps & IDispatchProps
class LogViewerContainer extends React.PureComponent<TComponentProps, IState> {
  private onChooseLogfile: any

  private onRefreshLogfile: any

  public constructor(props: TComponentProps) {
    super(props)

    this.state = { availableLogs: null, currentFilename: null }

    this.onChooseLogfile = (event: React.ChangeEvent<HTMLSelectElement>) => {
      // eslint-disable-next-line react/no-access-state-in-setstate
      this.setState({ ...this.state, currentFilename: event.target.value })
    }

    this.onRefreshLogfile = () => {
      this.setState((prevState) => ({ ...prevState, currentFilename: `${prevState.currentFilename}&s=${Date.now()}` }))
    }
  }

  public async componentDidMount() {
    this.setState({ availableLogs: await getAvailableLogFiles() })
  }

  public render() {
    const { availableLogs, currentFilename } = this.state

    if (availableLogs === null) {
      return null
    }

    return (
      <LogViewer
        availableLogs={availableLogs}
        currentFilename={currentFilename}
        onChooseLogfile={this.onChooseLogfile}
        onRefreshLogfile={this.onRefreshLogfile}
      />
    )
  }
}

const mapStateToProps = (_state: IStore, _ownProps: TComponentProps): IStoreProps => {
  return {}
}

const mapDispatchToProps = (_dispatch: Function): IDispatchProps => {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(LogViewerContainer)
