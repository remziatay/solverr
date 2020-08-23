import React from 'react'
import ImageInput from './ImageInput'
import ClearButton from './ClearButton'
import Status from './Status'

export default class TopController extends React.Component {
  render () {
    return (
      <div className="container-md mb-2">
        <div className="row" id="top-controller" hidden>
          <ImageInput/>
          <ClearButton/>
        </div>

        <Status/>
      </div>
    )
  }
}
