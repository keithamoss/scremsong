/* eslint-disable react/no-access-state-in-setstate */
import { withStyles, WithStyles } from '@material-ui/core'
import { grey } from '@material-ui/core/colors'
import * as React from 'react'
import { ITriageColumn } from '../../redux/modules/triage'
import TweetColumnContainer from '../TweetColumn/TweetColumnContainer'
import TweetColumnAssignerContainer, {
  ETweetColumnAssignerMode,
} from '../TweetColumnAssigner/TweetColumnAssignerContainer'
import TweetColumnBarContainer from '../TweetColumnBar/TweetColumnBarContainer'

const styles = () =>
  ({
    columnContainerContainer: {
      display: 'inline-block',
      height: '100%',
      backgroundColor: grey[200],
      '& .tweet': {
        width: '370px !important',
        minHeight: '123px !important', // Height of the ActionBar
        display: 'inline-block !important',
      },
    },
    columnContainer: {
      display: 'flex',
      flexDirection: 'row',
      height: '100%',
    },
    column: {
      width: '420px',
      height: '100%',
      marginRight: '5px',
    },
  } as any)

export interface IProps {
  columns: ITriageColumn[]
  onlyShowAssignedColumns: boolean
  userId: number
}

export interface IState {
  assignerOpen: boolean
  tweetId: string | null
  assignmentId: number | null
}

type TComponentProps = IProps & WithStyles
class TriageView extends React.Component<TComponentProps, IState> {
  private onOpenAssigner: any

  private onCloseAssigner: any

  public constructor(props: TComponentProps) {
    super(props)

    this.state = { assignerOpen: false, assignmentId: null, tweetId: null }

    this.onOpenAssigner = (tweetId: string, assignmentId: number | null) => {
      this.setState({ ...this.state, ...{ assignerOpen: true, tweetId, assignmentId } })
    }
    this.onCloseAssigner = () => {
      this.setState({ ...this.state, ...{ assignerOpen: false, tweetId: null, assignmentId: null } })
    }
  }

  public render() {
    const { columns, onlyShowAssignedColumns, userId, classes } = this.props
    const { assignerOpen, assignmentId, tweetId } = this.state

    return (
      <React.Fragment>
        <TweetColumnAssignerContainer
          open={assignerOpen}
          assignmentId={assignmentId}
          tweetId={tweetId}
          mode={ETweetColumnAssignerMode.ASSIGN}
          onCloseAssigner={this.onCloseAssigner}
        />
        <div className={classes.columnContainerContainer}>
          <div className={classes.columnContainer}>
            {columns.map((column: ITriageColumn, _key: number) => {
              if (
                onlyShowAssignedColumns === false ||
                (onlyShowAssignedColumns === true && column.assigned_to === userId)
              ) {
                return (
                  <div key={column.id} className={classes.column}>
                    <TweetColumnBarContainer column={column} />
                    <TweetColumnContainer column={column} onOpenAssigner={this.onOpenAssigner} />
                  </div>
                )
              }
              return null
            })}
          </div>
        </div>
      </React.Fragment>
    )
  }
}

export default withStyles(styles)(TriageView)
