import $ from 'jquery'
import 'popper.js'
import 'bootstrap'
import Peer from 'peerjs'
import { PZPath } from './PZPath'
import { PZImage } from './PZImage'
import { initCanvas } from './initCanvas'

const inputImage = document.getElementById('input-image')
const clearButton = document.getElementById('clear-button')
const statusText = document.getElementById('status-text')

$('#status-text').tooltip({
  title: 'Copied to clipboard',
  placement: 'bottom',
  trigger: 'manual'
})

statusText.innerText = 'Connecting...'

let pz, conn
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

const peer = new Peer(name1, {
  host: 'peerjs-server.herokuapp.com',
  secure: true,
  port: 443
})

peer.on('open', function (id) {
  console.log('My peer ID is: ' + id)
  if (window.location.hash) {
    conn = peer.connect(name2)
    conn.on('open', () => connected())
  } else {
    const link = `${window.location.origin}${window.location.pathname.replace('//', '/')}#${name2}${name1}`
    statusText.innerHTML = `Share link: <a href="${link}">${link}</a>`
    const copyButton = document.getElementById('copy-link')
    copyButton.innerText = navigator.share ? 'Share' : 'Copy'
    const copyToClipBoard = () => {
      const input = document.createElement('input')
      input.value = link
      document.body.appendChild(input)
      input.select()
      input.setSelectionRange(0, 99999)
      document.execCommand('copy')
      input.remove()
      $('#status-text').tooltip('show')
      setTimeout(() => $('#status-text').tooltip('hide'), 2500)
    }
    copyButton.onclick = !navigator.share ? copyToClipBoard : () => {
      navigator.share({
        title: 'Solverr',
        text: 'Join me on Solverr!',
        url: link
      }).catch(copyToClipBoard)
    }
    copyButton.hidden = false
  }
})

peer.on('connection', connection => connected(connection))

function connected (connection) {
  if (connection) conn = connection
  statusText.innerText = 'Connected'
  console.log('connected to peer')
  pz = initCanvas(conn)
  inputImage.onchange = setImage
  clearButton.onclick = clear
  conn.on('data', ondata)
}

function ondata (data) {
  if (data.type === 'path') new PZPath(pz, conn).from(data).finish()
  else if (data.type === 'image') new PZImage(pz, conn, true).from(data)
  else if (data.type === 'clear') pz.clear()
}

function setImage () {
  const file = inputImage.files[0]
  if (!file.type.match(/image-*/)) return
  new PZImage(pz, conn).start(file)
}

function clear () {
  pz.clear()
  conn.send({
    type: 'clear'
  })
}
