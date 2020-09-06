import React from 'react'
import Peer from 'peerjs'
import Header from './Components/Header'
import TopController from './Components/TopController'
import CanvasContainer from './Components/CanvasContainer'
import { PZImage } from './Tools/PZImage'

export default class App extends React.Component {
  link = `${window.location.origin}${window.location.pathname.replace('//', '/')}#${this.props.name2}${this.props.name1}`

  state = {
    statusText: 'Connecting',
    shareLink: false,
    ready: false
  }

  componentDidMount () {
    const peer = new Peer(this.props.name1, {
      host: 'peerjs-server.herokuapp.com',
      secure: true,
      port: 443
    })

    const connected = connection => {
      if (connection) {
        this.conn = connection
        this.setState({ conn: this.conn })
      }
      this.setState({
        statusText: 'Connected',
        shareLink: false,
        ready: 'true'
      })
      console.log('connected to peer')
    }

    peer.on('open', id => {
      console.log('My peer ID is: ' + id)
      if (!window.location.hash) window.location.hash = this.props.name1 + this.props.name2
      const conn = peer.connect(this.props.name2)
      conn.on('open', () => connected(conn))
      this.setState({
        statusText: 'Share link: ',
        shareLink: true
      })
    }
    )

    peer.on('connection', connection => connected(connection))
  }

  setPZ = pz => {
    this.pz = pz
  }

  setImage = evt => {
    const file = evt.target.files[0]
    if (!file.type.match(/image-*/)) return
    this.setState({
      imageAdding: new PZImage(this.pz, this.conn).after(() => { this.setState({ imageAdding: null }) }).start(file)
    })
  }

  clear = () => {
    this.pz.clear()
    this.conn.send({
      type: 'clear'
    })
  }

  render () {
    return (
      <>
        <Header />
        <TopController
          setImage={this.setImage}
          clear={this.clear}
          statusText={this.state.statusText}
          share={this.state.shareLink}
          link={this.link}
          ready={this.state.ready}/>
        {this.state.ready && <CanvasContainer connection={this.state.conn} setPZ={this.setPZ} image={this.state.imageAdding}/>}
      </>
    )
  }
}
