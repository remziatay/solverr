import React from 'react'

export default class Status extends React.Component {
  render () {
    return (
      <div className="row" id="status">
        <div className="col-sm-12 text-center text-truncate">
          <span className="font-weight-bolder">Status:</span>
          <span id="status-text" className="text-wrap"></span>
          <button id="copy-link" className="btn btn-outline-dark btn-sm" hidden>Copy</button>
        </div>
      </div>
    )
  }
}
