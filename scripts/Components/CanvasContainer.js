import React from 'react'

export default class CanvasContainer extends React.Component {
  render () {
    return (
      <div id="main-container" hidden>
        <canvas id="main-canvas" className="shadow border border-dark"></canvas>
        <div id="toolbox" className='shadow border border-dark'>Toolbox</div>
      </div>
    )
  }
}
