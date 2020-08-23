import React from 'react'
import ReactDom from 'react-dom'
import Header from './Components/Header'
import TopController from './Components/TopController'
import CanvasContainer from './Components/CanvasContainer'

export default class App extends React.Component {
  render () {
    return (
      <>
        <Header/>
        <TopController/>
        <CanvasContainer/>
      </>
    )
  }
}

ReactDom.render(<App/>, document.getElementById('app'))
