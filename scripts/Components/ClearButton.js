import React from 'react'

export default class ClearButton extends React.Component {
  render () {
    return (
      <button onClick={this.props.clear} className="clear-btn" type="reset">Clear Canvas</button>
    )
  }
}
