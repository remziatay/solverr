import React from 'react'
import NavLink from './NavLink'

export default class Header extends React.Component {
  state = {
    navs: [
      { text: 'Home', link: '/' },
      { text: 'About', link: '/' },
      { text: 'Contact', link: '/' }
    ],
    active: this.props.active || 0
  }

  render () {
    return (
      <nav className="navbar navbar-expand-sm navbar-dark bg-dark static-top mb-2">
        <div className="container">
          <a className="navbar-brand" href="/">Solverr</a>
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarResponsive"
            aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarResponsive">
            <ul className="navbar-nav ml-auto">
              {this.state.navs.map(({ text, link }, index) => (
                <NavLink key={text} text={text} link={link} active={this.state.active === index} />
              ))}
            </ul>
          </div>
        </div>
      </nav>
    )
  }
}
