import React from 'react'
import TopController from '../Components/TopController'
import CanvasContainer from '../Components/CanvasContainer'
import { withRouter } from 'react-router-dom'
import { PZImage } from '../Tools/PZImage'

class HomePage extends React.Component {
  state = {
    imageAdding: null
  }

  componentDidUpdate () {
    const newHash = `#${this.props.name1}${this.props.name2}`
    if (this.props.match.isExact && this.props.location.hash !== newHash) {
      this.props.history.replace('/' + newHash)
    }
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
        {this.props.match.isExact && <TopController
          setImage={this.setImage}
          clear={this.clear}
          statusText={this.props.statusText}
          share={this.props.share}
          link={`${window.location.origin}${window.location.pathname.replace('//', '/')}#${this.props.name2}${this.props.name1}`}
          ready={this.props.ready}/>}
        {this.props.ready && <CanvasContainer show={this.props.match.isExact} connection={this.props.connection} setPZ={this.setPZ} image={this.state.imageAdding}/>}
      </>
    )
  }
}

export default withRouter(HomePage)
