import React from 'react'
import $ from 'jquery'

export default class Status extends React.Component {
  componentDidMount () {
    $('#status-text').tooltip({
      title: 'Copied to clipboard',
      placement: 'bottom',
      trigger: 'manual'
    })
  }

  copyOrShare = () => {
    const copyToClipBoard = () => {
      const input = document.createElement('input')
      input.value = this.props.link
      document.body.appendChild(input)
      input.select()
      input.setSelectionRange(0, 99999)
      document.execCommand('copy')
      input.remove()
      $('#status-text').tooltip('show')
      setTimeout(() => $('#status-text').tooltip('hide'), 2500)
    }
    if (!navigator.share) copyToClipBoard()
    else {
      navigator.share({
        title: 'Solverr',
        text: 'Join me on Solverr!',
        url: this.props.link // TODO: add link prop
      }).catch(copyToClipBoard)
    }
  }

  render () {
    return (
      <div className="row">
        <div className="col-sm-12 text-center text-truncate">
          <span className="font-weight-bolder">Status:</span>
          <span className="text-wrap">
            {this.props.statusText}
            {this.props.share && <a href={this.props.link}>{this.props.link}</a>}
          </span>
          {this.props.share && <button id="copy-link" onClick={this.copyOrShare} className="btn btn-outline-dark btn-sm">{navigator.share ? 'Share' : 'Copy'}</button>}
        </div>
      </div>
    )
  }
}