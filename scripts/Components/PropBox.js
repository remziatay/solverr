/** @jsx nativeEvents */
import React from 'react'
import nativeEvents from 'jsx-native-events'
import 'vanilla-colorful'

export default class PropBox extends React.Component {
  state = {
    open: false
  }

  shouldComponentUpdate (props) {
    return this.state.open || this.state.open !== props.open
  }

  toggleOpen = () => {
    this.setState(state => ({ open: !state.open }))
  }

  handleColorChange = evt => {
    this.props.setColor(evt.detail.value)
  }

  handleBrushSize = evt => {
    this.props.setStrokeSize(evt.target.value)
  }

  render () {
    return (
      <div id="prop-box" className={this.state.open ? 'open' : null}>
        <button className="toggle-button" onClick={this.toggleOpen}><i className='arrow'></i></button>
        { this.state.open && (
          <>
            <hex-color-picker
              color={this.props.color}
              onEventColorChanged={this.handleColorChange}
            />
            <label style={{ marginBottom: 0 }} htmlFor="strokeSize">Brush Width</label>
            <input onChange={this.handleBrushSize} value={this.props.strokeSize} name="strokeSize" type="range" min="1" max="128"/>
          </>
        ) }
      </div>
    )
  }
}
