import React from 'react'
import Canvas from './Canvas'
import ToolBox from './ToolBox'

export default class CanvasContainer extends React.Component {
  render () {
    return (
      <div id="main-container">
        <Canvas connection={this.props.connection} setPZ={this.props.setPZ} image={this.props.image}/>
        <ToolBox/>
      </div>
    )
  }
}
