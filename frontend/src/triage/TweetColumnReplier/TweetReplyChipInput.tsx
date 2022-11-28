import FaceIcon from '@mui/icons-material/Face'
import { Autocomplete, TextField } from '@mui/material'
import React from 'react'

export interface IProps {
  defaultValue: string[]
  mustNotBeEmpty: boolean
  onChipChange: Function
  onFieldValid: Function
  onFieldInvalid: Function
}

type TComponentProps = IProps

export default function TweetReplyChipInput(props: TComponentProps) {
  const { defaultValue, onChipChange, onFieldValid, onFieldInvalid } = props

  const [errored, setErrored] = React.useState<boolean>(false)

  return (
    <Autocomplete
      multiple
      freeSolo
      defaultValue={defaultValue}
      options={[]}
      limitTags={4}
      ChipProps={{ icon: <FaceIcon /> }}
      sx={{ width: '588px' }}
      // Can't make the typings work on value for some reason *shrugs*
      onChange={(_e, value: any) => {
        const isErrored = value !== null && value.length === 0

        if (errored === true && isErrored === false) {
          onFieldValid()
        } else if (errored === false && isErrored === true) {
          onFieldInvalid()
        }

        setErrored(isErrored)

        if (value !== null && Array.isArray(value)) {
          onChipChange(value)
        }
      }}
      renderInput={(params: any) => (
        <TextField
          {...params}
          error={errored}
          label={errored === true ? 'You need to reply to at least one person' : 'Replying to'}
          placeholder="@"
        />
      )}
    />
  )
}
