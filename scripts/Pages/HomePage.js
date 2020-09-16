import React from 'react'
import TopController from '../Components/TopController'
import CanvasContainer from '../Components/CanvasContainer'
import { Redirect, withRouter } from 'react-router-dom'
import { PZImage } from '../Tools/PZImage'

class HomePage extends React.Component {
  state = {
    imageAdding: null
  }

  setPZ = pz => {
    this.pz = pz
  }

  setImage = evt => {
    this.clear()
    const file = evt.target.files[0]
    if (!file.type.match(/image-*/)) return
    this.setState({
      imageAdding: new PZImage(this.pz, this.props.connection).after(() => { this.setState({ imageAdding: null }) }).start(file)
    })
  }

  clear = () => {
    this.pz.clear()
    this.props.connection.send({
      type: 'clear'
    })
  }

  render () {
    return (
      <>
        <Redirect from='/' to={`/#${this.props.name1}${this.props.name2}`}/>
        <TopController
          setImage={this.setImage}
          clear={this.clear}
          statusText={this.props.statusText}
          share={this.props.share}
          link={`${window.location.origin}${window.location.pathname.replace('//', '/')}#${this.props.name2}${this.props.name1}`}
          ready={this.props.ready}/>
        {this.props.ready && <CanvasContainer connection={this.props.connection} setPZ={this.setPZ} image={this.state.imageAdding}/>}
      </>
    )
  }
}

export default withRouter(HomePage)
