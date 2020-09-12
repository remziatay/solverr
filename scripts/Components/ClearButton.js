import React from 'react'

export default class ClearButton extends React.Component {
  render () {
    return (
      <button className='generic-hover' onClick={this.props.clear} id="clear-button">Clear Canvas</button>
    )
  }
}
