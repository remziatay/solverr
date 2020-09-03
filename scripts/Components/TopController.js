import '../../styles/Components/top-controller.css'
import React from 'react'
import ImageInput from './ImageInput'
import ClearButton from './ClearButton'
import Status from './Status'

export default class TopController extends React.Component {
  render () {
    return (
      <div className="top-controller">
        {
          this.props.ready
            ? (
              <>
                <ImageInput setImage={this.props.setImage}/>
                <ClearButton clear={this.props.clear}/>
              </>
            )
            : (
              <Status
                statusText={this.props.statusText}
                share={this.props.share}
                link={this.props.link}/>
            )
        }
      </div>
    )
  }
}
