import '../../styles/Components/file-input.css'
import React from 'react'

export default class ImageInput extends React.Component {
  render () {
    return (
      <label className="file">
        <input onChange={this.props.setImage} type="file" accept="image/*"/>
        <span className="input-label">Upload your question</span>
      </label>
    )
  }
}
