import React from 'react'
import ImageInput from './ImageInput'
import ClearButton from './ClearButton'
import Status from './Status'

export default class TopController extends React.Component {
  render () {
    return (
      <div className="container-md mb-2">
        <div className="row" id="top-controller" hidden>
          <ImageInput setImage={this.props.setImage}/>
          <ClearButton clear={this.props.clear}/>
        </div>

        <Status
          statusText={this.props.statusText}
          share={this.props.share}
          link={this.props.link}/>
      </div>
    )
  }
}
