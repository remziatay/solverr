import App from './App'
import React from 'react'
import ReactDom from 'react-dom'

let name1, name2

if (window.location.hash) {
  name1 = window.location.hash.substr(1, 16)
  name2 = window.location.hash.substr(17, 16)
} else {
  // name1 = Math.random().toString(36).substr(2, 8) + Math.random().toString(36).substr(2, 8);
  // name2 = Math.random().toString(36).substr(2, 8) + Math.random().toString(36).substr(2, 8);
  // window.location.hash = name1 + name2;
  name1 = '6owmyzv313ihs1x9'
  name2 = 'r2368j2nlo14251b'
}

ReactDom.render(<App name1={name1} name2={name2}/>, document.getElementById('app'))
