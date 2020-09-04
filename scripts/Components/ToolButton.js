import React from 'react'

export default class ToolButton extends React.Component {
  render () {
    return (
      <button onClick={this.props.click} className="tool-button">{this.props.name}</button>
    )
  }
}
