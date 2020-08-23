import React from 'react'

export default class ClearButton extends React.Component {
  render () {
    return (
      <div className="col-sm-4">
        <button onClick={this.props.clear} id="clear-button" className="btn btn-block btn-danger" type="reset">Clear Canvas</button>
      </div>
    )
  }
}
