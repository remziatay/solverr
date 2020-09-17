import React from 'react'

class InfoCard extends React.Component {
  render () {
    return (
      <div className='info-card'>
        <h1>{this.props.title}</h1>
        {this.props.children}
      </div>
    )
  }
}

export default InfoCard
