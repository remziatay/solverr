import React from 'react'

export default class NavLink extends React.Component {
  render () {
    return (
      <li className={'nav-item' + (this.props.active ? ' active' : '')}>
        <a className="nav-link" href={this.props.link}>{this.props.text}</a>
      </li>
    )
  }
}
