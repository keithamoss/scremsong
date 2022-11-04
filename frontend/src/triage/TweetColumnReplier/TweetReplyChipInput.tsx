import { Theme } from '@mui/material'
import { withStyles, WithStyles } from '@mui/styles'
// import ChipInput from 'material-ui-chip-input'
import * as React from 'react'

const styles = (theme: Theme) => ({
  root: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  chip: {
    marginRight: theme.spacing(1),
  },
})

export interface IProps {
  defaultValue: string[]
  mustNotBeEmpty: boolean
  onChipChange: Function
  onFieldValid: Function
  onFieldInvalid: Function
}

export interface IState {
  // errored: boolean
}

type TComponentProps = IProps & WithStyles<typeof styles>
class TweetReplyChipInput extends React.Component<TComponentProps, IState> {
  // private chipRenderer: any

  // private handleChipChange: any

  public constructor(props: TComponentProps) {
    super(props)

    // this.state = { errored: false }

    // this.chipRenderer = (
    //   { value, isFocused, isDisabled, handleClick, handleDelete, defaultStyle }: any,
    //   key: string
    // ) => (
    //   <Chip
    //     key={key}
    //     style={{
    //       ...defaultStyle,
    //       pointerEvents: isDisabled ? 'none' : undefined,
    //     }}
    //     color={isFocused ? 'secondary' : undefined}
    //     className={props.classes.chip}
    //     onClick={handleClick}
    //     onDelete={handleDelete}
    //     label={value}
    //     avatar={
    //       <Avatar color={isFocused ? 'secondary' : undefined}>
    //         <FaceIcon />
    //       </Avatar>
    //     }
    //   />
    // )
    // this.handleChipChange = (chips: string[]) => {
    //   const errored = chips.length === 0
    //   if (this.state.errored === true && errored === false) {
    //     this.props.onFieldValid()
    //   } else if (this.state.errored === false && errored === true) {
    //     this.props.onFieldInvalid()
    //   }

    //   this.setState({ errored })
    //   this.props.onChipChange(chips)
    // }
  }

  public render() {
    // const { defaultValue, classes } = this.props
    // const { errored } = this.state

    return (
      // <ChipInput
      //   defaultValue={defaultValue}
      //   placeholder="@"
      //   fullWidth={true}
      //   fullWidthInput={true}
      //   variant="filled"
      //   chipRenderer={this.chipRenderer}
      //   newChipKeyCodes={[13, 32]}
      //   label="Replying to"
      //   InputLabelProps={{ shrink: true }}
      //   onChange={this.handleChipChange}
      //   classes={classes}
      //   error={errored}
      //   helperText={errored === true ? 'You need to reply to at least one person' : undefined}
      // />
      <div />
    )
  }
}

export default withStyles(styles)(TweetReplyChipInput)
