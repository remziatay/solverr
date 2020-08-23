import React from 'react'
import Peer from 'peerjs'
import Header from './Components/Header'
import TopController from './Components/TopController'
import CanvasContainer from './Components/CanvasContainer'
import { PZPath } from './PZPath'
import { PZImage } from './PZImage'

export default class App extends React.Component {
  link = `${window.location.origin}${window.location.pathname.replace('//', '/')}#${this.props.name2}${this.props.name1}`

  state = {
    statusText: 'Connecting',
    shareLink: false
  }

  componentDidMount () {
    const peer = new Peer(this.props.name1, {
      host: 'peerjs-server.herokuapp.com',
      secure: true,
      port: 443
    })

    const connected = connection => {
      if (connection) this.conn = connection
      this.setState({
        statusText: 'Connected',
        shareLink: false
      })
      console.log('connected to peer')
      import('./initCanvas').then(module => {
        this.pz = module.initCanvas(this.conn)
        this.conn.on('data', ondata)
      })
    }

    const ondata = data => {
      if (data.type === 'path') new PZPath(this.pz, this.conn).from(data).finish()
      else if (data.type === 'image') new PZImage(this.pz, this.conn, true).from(data)
      else if (data.type === 'clear') this.pz.clear()
    }

    peer.on('open', id => {
      console.log('My peer ID is: ' + id)
      if (window.location.hash) {
        this.conn = peer.connect(this.props.name2)
        this.conn.on('open', () => connected())
      } else {
        this.setState({
          statusText: 'Share link: ',
          shareLink: true
        })
      }
    })

    peer.on('connection', connection => connected(connection))
  }

  setImage = evt => {
    const file = evt.target.files[0]
    if (!file.type.match(/image-*/)) return
    new PZImage(this.pz, this.conn).start(file)
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
          link={this.link}/>
        <CanvasContainer/>
      </>
    )
  }
}
