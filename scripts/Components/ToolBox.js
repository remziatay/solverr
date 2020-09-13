import '../../styles/Components/toolbox.css'
import React from 'react'
import PropBox from './PropBox'

export default class ToolBox extends React.Component {
  render () {
    return (
      <div id="toolbox">
        <PropBox
          setStrokeSize = {this.props.setStrokeSize}
          setColor = {this.props.setColor}
          strokeSize={this.props.strokeSize}
          color={this.props.color}
        />
        {this.props.buttons}
      </div>
    )
  }
}
