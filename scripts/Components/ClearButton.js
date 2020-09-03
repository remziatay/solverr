import React from 'react'

export default class ClearButton extends React.Component {
  render () {
    return (
      <button onClick={this.props.clear} id="clear-button">Clear Canvas</button>
    )
  }
}
