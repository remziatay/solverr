import React from 'react'

export default class ImageInput extends React.Component {
  render () {
    return (
      <div className="input-group">
        <div className="custom-file">
          <input onChange={this.props.setImage} type="file" className="custom-file-input" id="input-image" accept="image/*"/>
          <label className="custom-file-label" htmlFor="input-image">Upload your question</label>
        </div>
      </div>
    )
  }
}
