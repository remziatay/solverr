import React from 'react'

export default class Status extends React.Component {
  state = {
    tooltip: false
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
      this.setState({ tooltip: true }, () => setTimeout(() => this.setState({ tooltip: false }), 2000))
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
      <>
        <div className="tooltip">
          <div className={'tooltiptext ' + (this.state.tooltip ? 'pop' : '')}>Copied Link</div>
          <div className="status" >
            <span>Status:&nbsp;</span>
            <div>
              {this.props.statusText}
              {this.props.share && <a target='_blank' rel="noreferrer" href={this.props.link}>{this.props.link}</a>}
            </div>
          </div>
        </div>
        {this.props.share && <button id="share-button" onClick={this.copyOrShare}>{navigator.share ? 'Share' : 'Copy'}</button>}
      </>
    )
  }
}
