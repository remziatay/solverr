import React from 'react'
import NavLink from './NavLink'

export default class Header extends React.Component {
  state = {
    navs: [
      { text: 'Home', link: '/' },
      { text: 'About', link: '/' },
      { text: 'Contact', link: '/' }
    ],
    active: this.props.active || 0,
    open: false
  }

  buttonClick = evt => {
    this.setState(state => ({ open: !state.open }))
  }

  render () {
    return (
      <header id="navbar" className={this.state.open && 'open'}>
        <nav className="navbar-container">
          <a href="/" className="home-link">Solverr</a>
          <button onClick={this.buttonClick} type="button" className="navbar-toggle">
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </button>
          <ul className="navbar-menu">
            {this.state.navs.map(({ text, link }, index) => (
              <NavLink key={text} text={text} link={link} active={this.state.active === index} />
            ))}
          </ul>
        </nav>
      </header>
    )
  }
}
