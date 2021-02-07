import { FormControl, FormHelperText, TextField, Typography } from '@material-ui/core'
import { amber } from '@material-ui/core/colors'
import red from '@material-ui/core/colors/red'
import { TextFieldProps } from '@material-ui/core/TextField'
import * as React from 'react'

export interface IProps {
  onFieldChange: any
  characterPrefixLength: number
  characterLimit: number
  onFieldValid: any
  onFieldInvalid: any
}

export interface IState {
  errored: boolean | undefined
  characterCount: number | null
}

// Ref. https://github.com/mui-org/material-ui/pull/13029

type TComponentProps = IProps & TextFieldProps
class TextFieldWithCharacterCount extends React.Component<TComponentProps, IState> {
  // private el?: HTMLTextAreaElement

  public constructor(props: TComponentProps) {
    super(props)

    this.state = { errored: undefined, characterCount: null }

    // this.handleChange = this.handleChange.bind(this)
    // this.inputRef = this.inputRef.bind(this)
  }

  // public inputRef(el: HTMLTextAreaElement) {
  //     this.el = el
  // }

  // public handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
  //     const inputValue = event.target.value
  //     // console.log("handleChange", inputValue)

  //     // this.setState({ errored: this.isErrored(inputValue.length), characterCount: inputValue.length })
  //     this.props.onFieldChange(inputValue)
  // }

  // public componentDidMount() {
  //     if (this.props.defaultValue && typeof this.props.defaultValue === "string") {
  //         const defaultValueLen = this.props.defaultValue.length
  //         if (this.el && "setSelectionRange" in this.el) {
  //             this.el.setSelectionRange(defaultValueLen, defaultValueLen)
  //         }

  //         this.setState({ errored: this.isErrored(defaultValueLen), characterCount: defaultValueLen })
  //     }
  // }

  public componentDidUpdate(prevProps: TComponentProps, prevState: IState) {
    if (typeof this.props.value === 'string' && this.props.value !== prevProps.value) {
      const errored = this.isErrored(this.props.value.length)
      const characterCount = this.props.value.length
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ errored, characterCount })

      if (errored === true && (prevState.errored === false || prevState.errored === undefined)) {
        this.props.onFieldInvalid()
      }

      if (errored === false && (prevState.errored === true || prevState.errored === undefined)) {
        this.props.onFieldValid()
      }
    }
  }

  public getHelperText() {
    if (this.state.errored === true) {
      if (this.state.characterCount === 0) {
        return "Shouting into the void won't do you much good if you don't say anything"
      }
      return 'Steady on there, that tweet is a bit too long!'
    }
    return undefined
  }

  // eslint-disable-next-line class-methods-use-this
  public getCount(props: TComponentProps, state: IState) {
    let count = 0
    if (state.characterCount !== null) {
      count = state.characterCount
    } else if (props.value && typeof props.value === 'string') {
      count = props.value.length
    } else {
      count = 0
    }

    if (typeof props.characterPrefixLength === 'number') {
      count += props.characterPrefixLength
    }
    return count
  }

  public isErrored(characterCount: number) {
    if (characterCount === 0) {
      return true
    }

    if (characterCount + this.props.characterPrefixLength > this.props.characterLimit) {
      return true
    }

    return false
  }

  public render() {
    const {
      characterLimit,
      onFieldChange,
      onFieldInvalid,
      onFieldValid,
      characterPrefixLength,
      ...textFieldProps
    } = this.props
    const { id, FormHelperTextProps } = this.props
    const { errored } = this.state

    // @TOOD [Backend] Handle the same reply being chosen twice in a row

    const helperText = this.getHelperText()
    const helperTextId = helperText && id ? `${id}-helper-text` : undefined
    const helperTextStyle = {
      display: 'flex',
      justifyContent: 'space-between',
    }

    const count = this.getCount(this.props, this.state)

    let counterStyle = { paddingRight: 15, marginTop: 8, lineHeight: '12px' }
    if (count > characterLimit) {
      counterStyle = { ...counterStyle, ...{ color: red[500] } }
    } else if (count >= characterLimit * 0.8) {
      counterStyle = { ...counterStyle, ...{ color: amber[500] } }
    }

    return (
      <FormControl fullWidth={true} error={errored} style={{ marginBottom: 8 }}>
        {/* inputRef={this.inputRef} */}
        <TextField {...textFieldProps} error={errored} onChange={onFieldChange} />
        <div style={helperTextStyle}>
          <FormHelperText id={helperTextId} {...FormHelperTextProps}>
            {helperText}
          </FormHelperText>
          {characterLimit && (
            <Typography variant="caption" align="right" style={counterStyle}>
              {count}/{characterLimit}
            </Typography>
          )}
        </div>
      </FormControl>
    )
  }
}

export default TextFieldWithCharacterCount
