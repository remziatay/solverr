import React from 'react'

export default class ImageInput extends React.Component {
  render () {
    return (
      <div className="input-group col-sm-8">
        <div className="custom-file">
          <input type="file" className="custom-file-input" id="input-image" accept="image/*"/>
          <label className="custom-file-label" htmlFor="input-image">Upload your question</label>
        </div>
      </div>
    )
  }
}
