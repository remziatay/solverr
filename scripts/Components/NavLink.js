import React from 'react'

export default class NavLink extends React.Component {
  render () {
    return (
      <li className={'navbar-item' + (this.props.active ? ' active' : '')}>
        <a className="navbar-link" href={this.props.link}>{this.props.text}</a>
      </li>
    )
  }
}
