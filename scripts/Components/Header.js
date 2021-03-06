import '../../styles/Components/header.css'
import React, { createRef } from 'react'
import NavLink from './NavLink'
import { Link } from 'react-router-dom'

export default class Header extends React.Component {
  state = {
    navs: [
      { text: 'Home', link: '/' },
      { text: 'About', link: '/about' },
      { text: 'Contact', link: '/contact' }
    ],
    active: this.props.active || 0,
    open: false
  }

  toggleRef = createRef()

  close = evt => {
    if (evt.target.classList.contains('navbar-link')) return
    const toggle = this.toggleRef.current
    if ([toggle, ...toggle.children].includes(evt.target)) return
    this.setState({ open: false })
    document.body.removeEventListener('touchstart', this.close)
    document.body.removeEventListener('mousedown', this.close)
  }

  buttonClick = () => {
    if (!this.state.open) {
      document.body.addEventListener('touchstart', this.close)
      document.body.addEventListener('mousedown', this.close)
    } else {
      document.body.removeEventListener('touchstart', this.close)
      document.body.removeEventListener('mousedown', this.close)
    }
    this.setState(state => ({ open: !state.open }))
  }

  render () {
    return (
      <header id="navbar" className={this.state.open ? 'open' : ''}>
        <nav className="navbar-container">
          <Link to="/" className="home-link">Solverr</Link>
          <button ref={this.toggleRef} onClick={this.buttonClick} aria-label="Navigation Menu" className="navbar-toggle">
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
