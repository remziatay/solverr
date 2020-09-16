import React from 'react'
import { NavLink as RNavLink } from 'react-router-dom'

export default class NavLink extends React.Component {
  render () {
    return (
      <li className={'navbar-item'}>
        <RNavLink exact className="navbar-link generic-hover" activeClassName='active' to={this.props.link}>{this.props.text}</RNavLink>
      </li>
    )
  }
}
