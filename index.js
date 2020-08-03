// import {Canvas} from "./canvas"
import { CircleContextMenu } from './CircleContextMenu.js'
import { PZcanvas } from './PZcanvas.js'
import { PZPath } from './PZPath.js'
import { PZImage } from './PZImage.js'

const inputImage = document.getElementById('input-image')
const clearButton = document.getElementById('clear-button')
const status = document.getElementById('status-text')
/*
const canvasDiv = document.getElementById('canvas-div')
const layerImage = document.getElementById('layer-image').getContext('2d')
const layerStudent = document.getElementById('layer-student').getContext('2d')
const layerTeacher = document.getElementById('layer-teacher').getContext('2d')
*/

status.innerText = 'Connecting...'

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

// const canvas = new Canvas([layerImage, layerStudent, layerTeacher]);
/*
function setSizes () {
  layerTeacher.canvas.width = layerStudent.canvas.width = layerImage.canvas.width =
    canvasDiv.offsetWidth
  layerTeacher.canvas.height = layerStudent.canvas.height = layerImage.canvas.height =
    canvasDiv.offsetHeight
}

setSizes()
window.onscroll = setSizes
window.onresize = setSizes
*/

const menu = new CircleContextMenu(200)
menu.addButton('Pan', () => (mode = 'pan'))
menu.addButton('Draw', () => (mode = 'edit'))

window.addEventListener('resize', () => menu.resize())

const pz = new PZcanvas(900, 600, 3)

// document.body.appendChild(pz.shadowCanvas);
// pz.shadowCanvas.style.border = '2px dotted magenta';

var conn
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
  document.body.appendChild(pz.canvas)
  pz.canvas.style.border = '1px solid green'
  conn.on('data', ondata)
}

function ondata (data) {
  if (data.type === 'path') new PZPath(pz, conn).from(data).finish()
  else if (data.type === 'image') new PZImage(pz, conn).from(data)
  else if (data.type === 'clear') pz.clear()
}

let mode = 'edit' // edit or pan
let dragStart = false
let dragging = false
let drawingPath

pz.canvas.onmousedown = evt => {
  if (evt.buttons === 1) {
    dragStart = true
    dragging = false
    drawingPath = new PZPath(pz, conn)
  } else if (evt.buttons === 3) {
    // left and right click at the same time to cancel dragging
    dragStart = false
    dragging = false
    drawingPath.cancel()
  } else if (evt.buttons === 2) {
    menu.show(evt.clientX, evt.clientY)
  }
}

menu.canvas.onmouseup = () => menu.choose()

pz.canvas.oncontextmenu = evt => evt.preventDefault()

pz.canvas.onmousemove = evt => {
  if (!dragStart) return
  dragging = true
  let x, y
  switch (mode) {
    case 'edit':
      x = evt.offsetX
      y = evt.offsetY
      drawingPath.add(x - evt.movementX, y - evt.movementY, x, y)
      break
    case 'pan':
      pz.pan(-evt.movementX, -evt.movementY)
      break
    default:
      break
  }
}

pz.canvas.onmouseup = evt => {
  if (!dragStart) return
  dragStart = false
  if (!dragging) {
    const x = evt.offsetX
    const y = evt.offsetY
    const zoom = evt.shiftKey ? 0.9 : 1.1
    pz.zoom(zoom, x, y)
  } else if (mode === 'edit') {
    drawingPath.finish()
  }
  dragging = false
}

// const image = new Image();

inputImage.onchange = function () {
  const file = inputImage.files[0]
  if (!file.type.match(/image-*/)) return
  new PZImage(pz, conn).start(file)
}

clearButton.onclick = () => {
  pz.clear()
  conn.send({
    type: 'clear'
  })
}

/*
const scaleFactor = 1.1
// let scale = 1;

var tempCanvas = document.createElement('canvas')
// eslint-disable-next-line no-tabs
var tempCtx = tempCanvas.getContext('2d')
tempCanvas.width = canvasDiv.offsetWidth
tempCanvas.height = canvasDiv.offsetHeight
document.body.appendChild(tempCanvas)

function draw () {
  tempCtx.clearRect(0, 0, canvasDiv.offsetWidth - panX, canvasDiv.offsetHeight - panY)

  tempCtx.setTransform(1 / scale, 0, 0, 1 / scale, -panX, -panY)
  tempCtx.drawImage(layerTeacher.canvas, 0, 0)
  tempCtx.setTransform(1, 0, 0, 1, 0, 0)
  layerImage.clearRect(0, 0, canvasDiv.offsetWidth - panX, canvasDiv.offsetHeight - panY)
  layerTeacher.clearRect(0, 0, canvasDiv.offsetWidth - panX, canvasDiv.offsetHeight - panY)
  // layerImage.save();
  // layerImage.transform(scale, 0, 0, scale, panX, panY)
  layerImage.setTransform(scale, 0, 0, scale, panX, panY)
  layerStudent.setTransform(scale, 0, 0, scale, panX, panY)

  layerTeacher.drawImage(tempCanvas, 0, 0)
  layerTeacher.setTransform(scale, 0, 0, scale, panX, panY)

  layerImage.drawImage(image, 0, 0)
  // layerImage.restore();
}

dragStart = false
dragged = true

canvasDiv.addEventListener(
  'mousedown',
  function (evt) {
    // document.body.style.userSelect = 'none';
    dragStart = true
    dragged = false
  },
  false
)

let cumX = 0
let cumY = 0

const panIt = () => {
  requestAnimationFrame(panIt)
  if (!cumX && !cumY) return
  requestAnimationFrame(() => {
    canvas.pan(cumX, cumY)
    cumX = 0
    cumY = 0
  })
}
requestAnimationFrame(panIt)

canvasDiv.addEventListener(
  'mousemove',
  function (evt) {
    if (dragStart) {
      dragged = true
      cumX += evt.movementX
      cumY += evt.movementY
      // canvas.pan(evt.movementX, evt.movementY);
      return
    }

    var rect = canvasDiv.getBoundingClientRect()
    const x = evt.clientX - rect.left
    const y = evt.clientY - rect.top
    canvas.addLine(x - evt.movementX, y - evt.movementY, x, y, 2)
    /* panX += evt.movementX;
    panY += evt.movementY;
    draw(); /*
  },
  false
)

canvasDiv.addEventListener(
  'mouseup',
  function (evt) {
    dragStart = false
    if (evt.ctrlKey) {
      var rect = canvasDiv.getBoundingClientRect()
      const x = evt.clientX - rect.left
      const y = evt.clientY - rect.top
      console.log(x, y)
      console.log(canvas.inversePoint(x, y))
      console.log(canvas.getPoint(canvas.inversePoint(x, y)))
      return
    }

    if (!dragged) zoom(evt.shiftKey ? -1 : 1)
  },
  false
)

var zoom = function (times) {
  canvas.zoom(Math.pow(scaleFactor, times))
}

var handleScroll = function (evt) {
  var delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0
  if (delta) zoom(delta)
  return evt.preventDefault() && false
}

canvasDiv.addEventListener('DOMMouseScroll', handleScroll, false)
canvasDiv.addEventListener('mousewheel', handleScroll, false)
*/
