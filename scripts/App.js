import React from 'react'
import Peer from 'peerjs'
import Header from './Components/Header'
import { BrowserRouter, Route } from 'react-router-dom'
import HomePage from './Pages/HomePage'
import AboutPage from './Pages/AboutPage'
import ContactPage from './Pages/ContactPage'

class App extends React.Component {
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

  render () {
    return (
      <>
        <BrowserRouter basename={process.env.basename}>
          <Header />

          <Route path='/'>
            <HomePage
              statusText={this.state.statusText}
              name1={this.props.name1}
              name2={this.props.name2}
              share={this.state.shareLink}
              ready={this.state.ready}
              connection={this.state.conn}
            />
          </Route>

          <Route path='/about'>
            <AboutPage/>
          </Route>

          <Route path='/contact'>
            <ContactPage/>
          </Route>

        </BrowserRouter>
      </>
    )
  }
}

export default App
