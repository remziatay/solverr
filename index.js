// import {Canvas} from "./canvas"
import { CircleContextMenu } from './CircleContextMenu.js'
import { PZcanvas } from './PZcanvas.js'
import { PZPath } from './PZPath.js'
import { PZImage } from './PZImage.js'
import { TouchHandler } from './touchHandler.js'

const inputImage = document.getElementById('input-image')
const clearButton = document.getElementById('clear-button')
const status = document.getElementById('status-text')
const canvas = document.getElementById('main-canvas')
/* const canvas = document.createElement('canvas')
document.body.appendChild(canvas) */

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

window.addEventListener('resize', () => {
  menu.resize()
  if (pz) pz.resize()
})

let pz
const menu = new CircleContextMenu(200)
menu.addButton('Pan', () => {
  mode = 'pan'
  canvas.style.cursor = 'grab'
})
menu.addButton('Draw', () => {
  mode = 'edit'
  changeStrokeSize(0)
})

let strokeSize = 10
function changeStrokeSize (change) {
  strokeSize += change
  strokeSize = Math.min(Math.max(strokeSize, 1), 128)
  if (strokeSize < 5) {
    canvas.style.cursor = 'crosshair'
    return
  }
  const svg = `<svg width="${strokeSize}" height="${strokeSize}" xmlns="http://www.w3.org/2000/svg"><circle r="${strokeSize / 2 - 1}" cy="${strokeSize / 2}" cx="${strokeSize / 2}" stroke-width="1.5" stroke="black" fill="none"/></svg>`
  canvas.style.cursor = `url('data:image/svg+xml;utf8,${svg}') ${strokeSize / 2} ${strokeSize / 2}, auto`
  canvas.focus()
}

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
  initCanvas()
  conn.on('data', ondata)
}

function ondata (data) {
  if (data.type === 'path') new PZPath(pz, conn).from(data).finish()
  else if (data.type === 'image') new PZImage(pz, conn, true).from(data)
  else if (data.type === 'clear') pz.clear()
}

const touchHandler = new TouchHandler(500, 3)

function initCanvas () {
  canvas.hidden = false
  canvas.width = canvas.offsetWidth - canvas.offsetWidth % 2
  canvas.height = canvas.offsetHeight - canvas.offsetHeight % 2
  canvas.style.width = canvas.width + 'px'
  canvas.style.height = canvas.height + 'px'
  canvas.hidden = true
  pz = new PZcanvas(canvas, 4800, 3200)
  canvas.onmousedown = onMouseDown
  canvas.onmousemove = onMouseMove
  canvas.onmouseup = onMouseUp
  canvas.ontouchstart = touchHandler.onTouchStart
  canvas.ontouchmove = touchHandler.onTouchMove
  canvas.ontouchend = touchHandler.onTouchEnd
  canvas.onwheel = handleScroll
  canvas.style.border = '1px solid green'
  canvas.hidden = false
}

let mode = 'edit' // edit or pan
if (mode === 'edit') changeStrokeSize(0)
else if (mode === 'pan') canvas.style.cursor = 'grab'
let dragStart = false
let dragging = false
let drawingPath

menu.canvas.onmouseup = () => menu.choose()

canvas.oncontextmenu = evt => evt.preventDefault()

const onMouseDown = evt => {
  if (evt.buttons === 1) {
    dragStart = true
    dragging = false
    if (mode === 'edit') drawingPath = new PZPath(pz, conn, strokeSize)
    else if (mode === 'pan') canvas.style.cursor = 'grabbing'
  } else if (evt.buttons === 3 && mode === 'edit') {
    // left and right click at the same time to cancel dragging
    dragStart = false
    dragging = false
    drawingPath.cancel()
  } else if (evt.buttons === 2) {
    menu.show(evt.clientX, evt.clientY)
  }
}

const onMouseMove = evt => {
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

const onMouseUp = evt => {
  if (!dragStart || evt.button !== 0) return
  if (mode === 'pan') canvas.style.cursor = 'grab'
  dragStart = false
  if (!dragging) {
    const zoom = evt.shiftKey ? 0.9 : 1.1
    pz.zoom(zoom, evt.offsetX, evt.offsetY)
  } else if (mode === 'edit') {
    drawingPath.finish()
  }
  dragging = false
}

touchHandler.addGestureListener('drag',
  (touch, lastTouch, evt) => {
    const x = touch.clientX
    const y = touch.clientY
    switch (mode) {
      case 'edit': {
        const rect = evt.target.getBoundingClientRect()
        drawingPath.add(lastTouch.clientX - rect.left, lastTouch.clientY - rect.top, x - rect.left, y - rect.top)
        break
      }
      case 'pan':
        pz.pan(lastTouch.clientX - x, lastTouch.clientY - y)
        break
      default:
        break
    }
  },
  () => { if (mode === 'edit') drawingPath = new PZPath(pz, conn, strokeSize) },
  () => { if (mode === 'edit') drawingPath.finish() }
)

touchHandler.addGestureListener('longTouchDrag',
  (_, __, evt) => menu.ontouchmove(evt),
  (evt) => menu.show(evt.touches[0].clientX, evt.touches[0].clientY),
  () => menu.choose()
)

touchHandler.addGestureListener('twoFingerZoom',
  (zoom, center) => pz.zoom(1 + zoom, center.x, center.y),
  () => { if (mode === 'edit') drawingPath.cancel() }
)

touchHandler.addGestureListener('twoFingerDrag',
  (panX, panY) => pz.pan(panX, panY)
)

function handleScroll (evt) {
  evt.preventDefault()
  if (dragStart) return
  const delta = evt.wheelDelta ? -evt.wheelDelta / 120 : evt.deltaY / 3

  if (evt.ctrlKey && mode === 'edit') {
    changeStrokeSize(evt.deltaY < 0 ? 2 : -2)
    return
  }
  pz.zoom(1 - delta / 10, evt.offsetX, evt.offsetY)
}

inputImage.onchange = function () {
  const file = inputImage.files[0]
  if (!file.type.match(/image-*/)) return
  new PZImage(pz, conn).start(file)
}

clearButton.onclick = () => {
  pz.clear()
  pz.update()
  conn.send({
    type: 'clear'
  })
}
