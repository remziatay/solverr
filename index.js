import { PZPath } from './PZPath.js'
import { PZImage } from './PZImage.js'
import { initCanvas } from './initCanvas.js'

const inputImage = document.getElementById('input-image')
const clearButton = document.getElementById('clear-button')
const status = document.getElementById('status-text')

status.innerText = 'Connecting...'

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
    status.innerHTML = `Share link: <a href="${link}">${link}</a>`
  }
})

peer.on('connection', connection => connected(connection))

function connected (connection) {
  if (connection) conn = connection
  status.innerText = 'Connected'
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
