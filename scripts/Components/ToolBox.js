import React from 'react'

export default class ToolBox extends React.Component {
  render () {
    return (
      <div id="toolbox">
        {this.props.buttons}
      </div>
    )
  }
}
