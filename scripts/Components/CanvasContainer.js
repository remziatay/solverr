import '../../styles/Components/canvas-container.css'
import React from 'react'
import Canvas from './Canvas'
import ToolBox from './ToolBox'
import { PZBrush } from '../Tools/PZBrush'
import { PZLine } from '../Tools/PZLine'
import { PZRect } from '../Tools/PZRect'
import { PZEllipse } from '../Tools/PZEllipse'
import { PZCircle } from '../Tools/PZCircle'
import ToolButton from './ToolButton'
import { CircleContextMenu } from '../CircleContextMenu'

export default class CanvasContainer extends React.Component {
  state = {
    mode: 'pan',
    Tool: undefined,
    strokeSize: 10,
    cursor: 'grab'
  }

  tools = ['Pan', 'Brush', 'Line', 'Rect', 'Ellipse', 'Circle']
  classes = {
    brush: PZBrush,
    line: PZLine,
    rect: PZRect,
    ellipse: PZEllipse,
    circle: PZCircle
  }

  toolButtons = this.tools.map(
    tool => <ToolButton key={tool} name={tool} click={() => this.setTool(tool)}/>
  )

  changeStrokeSize = change => {
    this.setState(state => {
      const strokeSize = Math.min(Math.max(state.strokeSize + change, 1), 128)
      if (change && strokeSize === state.strokeSize) return
      const changes = { strokeSize }
      if (strokeSize < 5) changes.cursor = 'crosshair'
      else {
        const svg = `<svg width="${strokeSize}" height="${strokeSize}" xmlns="http://www.w3.org/2000/svg"><circle r="${strokeSize / 2 - 1}" cy="${strokeSize / 2}" cx="${strokeSize / 2}" stroke-width="1.5" stroke="black" fill="none"/></svg>`
        changes.cursor = `url('data:image/svg+xml;utf8,${svg}') ${strokeSize / 2} ${strokeSize / 2}, auto`
      }
      return changes
    })
  }

  setCursor = cursor => this.setState({ cursor })

  setTool = tool => {
    if (tool === 'Pan') {
      this.setState({ mode: 'pan', cursor: 'grab' })
      return
    }
    if (this.state.mode !== 'tool') this.changeStrokeSize(0)
    this.setState({ mode: 'tool', Tool: this.classes[tool.toLowerCase()] })
  }

  constructor (props) {
    super(props)
    const rootStyle = getComputedStyle(document.body)
    this.menu = new CircleContextMenu({
      r: Math.min(250, window.innerHeight / 2, window.innerWidth / 2) * window.devicePixelRatio,
      background: rootStyle.getPropertyValue('--tertiary-color') || '#e04e15',
      color: rootStyle.getPropertyValue('--text-color') || '#fcf7ff',
      chosenBackground: rootStyle.getPropertyValue('--primary-color') || '#0a1f33',
      chosenColor: rootStyle.getPropertyValue('--secondary-color') || '#e6c670'
    })
    this.menu.canvas.onmouseup = () => this.menu.choose()
    this.tools.forEach(tool => this.menu.addButton(tool, () => this.setTool(tool)))
  }

  render () {
    return (
      <main id="canvas-container">
        <Canvas connection={this.props.connection}
          setPZ={this.props.setPZ}
          image={this.props.image}
          constructors={this.classes}
          mode = {this.state.mode}
          Tool = {this.state.Tool}
          cursor = {this.state.cursor}
          strokeSize = {this.state.strokeSize}
          setCursor = {this.setCursor}
          changeStrokeSize = {this.changeStrokeSize}
          menu = {this.menu}
        />
        <ToolBox buttons={this.toolButtons}/>
      </main>
    )
  }
}
