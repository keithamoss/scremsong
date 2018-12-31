import { FormHelperText, TextField, Typography } from "@material-ui/core"
import { amber } from "@material-ui/core/colors"
import red from "@material-ui/core/colors/red"
import { TextFieldProps } from "@material-ui/core/TextField"
import * as React from "react"

export interface IProps {
    characterLimit: number
    onLimitError: any
    onLimitValid: any
}

export interface IState {
    characterCount: number | null
}

// Ref. https://github.com/mui-org/material-ui/pull/13029

type TComponentProps = IProps & TextFieldProps
class TextFieldWithCharacterCount extends React.PureComponent<TComponentProps, IState> {
    private el?: HTMLTextAreaElement

    public constructor(props: TComponentProps) {
        super(props)

        this.state = { characterCount: null }

        this.handleChange = this.handleChange.bind(this)
        this.inputRef = this.inputRef.bind(this)
    }

    public inputRef(el: HTMLTextAreaElement) {
        this.el = el
    }

    public handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        const input = event.target.value
        this.setState({
            characterCount: input.length,
        })
    }

    public componentDidMount() {
        if (this.props.defaultValue && typeof this.props.defaultValue === "string") {
            const defaultValueLen = this.props.defaultValue.length
            if (this.el && "setSelectionRange" in this.el) {
                this.el.setSelectionRange(defaultValueLen, defaultValueLen)
            }
            this.setState({ characterCount: defaultValueLen })
        }
    }

    public componentDidUpdate(prevProps: TComponentProps, prevState: IState) {
        if (this.state.characterCount !== null) {
            if (this.isOverLimit(this.props, this.state) === true && this.isOverLimit(prevProps, prevState) === false) {
                this.props.onLimitError()
            }
            if (this.isOverLimit(this.props, this.state) === false && this.isOverLimit(prevProps, prevState) === true) {
                this.props.onLimitValid()
            }
        }
    }

    public isOverLimit(props: TComponentProps, state: IState) {
        return this.getCount(props, state) > props.characterLimit
    }

    public getCount(props: TComponentProps, state: IState) {
        let count = 0
        if (state.characterCount !== null) {
            count = state.characterCount
        } else if (props.value && typeof props.value === "string") {
            count = props.value.length
        } else {
            count = 0
        }
        return count
    }

    public render() {
        const { characterLimit, onLimitError, onLimitValid, ...textFieldProps } = this.props
        const { helperText, id, FormHelperTextProps } = this.props

        const helperTextId = helperText && id ? `${id}-helper-text` : undefined
        const helperTextStyle = {
            display: "flex",
            justifyContent: "space-between",
        }

        const count = this.getCount(this.props, this.state)

        let counterStyle = { paddingRight: 15 }
        if (count > characterLimit) {
            counterStyle = { ...counterStyle, ...{ color: red[500] } }
        } else if (count >= characterLimit * 0.8) {
            counterStyle = { ...counterStyle, ...{ color: amber[500] } }
        }

        return (
            <React.Fragment>
                <TextField {...textFieldProps} inputRef={this.inputRef} onChange={this.handleChange} />
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
            </React.Fragment>
        )
    }
}

export default TextFieldWithCharacterCount
