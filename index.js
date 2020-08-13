// import {Canvas} from "./canvas"
import { CircleContextMenu } from './CircleContextMenu.js'
import { PZcanvas } from './PZcanvas.js'
import { PZPath } from './PZPath.js'
import { PZImage } from './PZImage.js'

const inputImage = document.getElementById('input-image')
const clearButton = document.getElementById('clear-button')
const status = document.getElementById('status-text')
const canvas = document.getElementById('main-canvas')

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

window.addEventListener('resize', () => menu.resize())

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

let strokeSize = 13
function changeStrokeSize (change) {
  strokeSize += change
  strokeSize = Math.min(Math.max(strokeSize, 3), 128)
  if (strokeSize < 5) {
    canvas.style.cursor = 'crosshair'
    return
  }
  const svg = `<svg width="${strokeSize}" height="${strokeSize}" xmlns="http://www.w3.org/2000/svg"><circle r="${strokeSize / 2 - 1}" cy="${strokeSize / 2}" cx="${strokeSize / 2}" stroke-width="1.5" stroke="black" fill="none"/></svg>`
  canvas.style.cursor = `url('data:image/svg+xml;utf8,${svg}') ${strokeSize / 2} ${strokeSize / 2}, auto`
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

  canvas.hidden = false
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
  canvas.hidden = true
  pz = new PZcanvas(canvas, 3200, 2000)
  canvas.hidden = false
  canvas.style.border = '1px solid green'
  conn.on('data', ondata)
}

function ondata (data) {
  if (data.type === 'path') new PZPath(pz, conn).from(data).finish()
  else if (data.type === 'image') new PZImage(pz, conn, true).from(data)
  else if (data.type === 'clear') pz.clear()
}

let mode = 'edit' // edit or pan
if (mode === 'edit') changeStrokeSize(0)
else if (mode === 'pan') canvas.style.cursor = 'grab'
let dragStart = false
let dragging = false
let drawingPath

canvas.onmousedown = evt => {
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

menu.canvas.onmouseup = () => menu.choose()

canvas.oncontextmenu = evt => evt.preventDefault()

canvas.onmousemove = evt => {
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

canvas.onmouseup = evt => {
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

const touchDuration = 500
let touchTimer, lastTouch, zoomCenter, twoFingerGesture
const touchCache = []

function handleTwoFinger (evt) {
  if (evt.targetTouches.length !== 2 || evt.changedTouches.length !== 2) return
  const touch1 = evt.targetTouches[0]
  const touch2 = evt.targetTouches[1]
  let index1 = -1
  let index2 = -1
  touchCache.forEach((touch, i) => {
    if (touch.identifier === touch1.identifier) index1 = i
    else if (touch.identifier === touch2.identifier) index2 = i
  })
  if (index1 < 0 || index2 < 0) {
    touchCache.length = 0
    return
  }
  const diffX1 = touch1.clientX - touchCache[index1].clientX
  const diffX2 = touch2.clientX - touchCache[index2].clientX
  const diffY1 = touch1.clientY - touchCache[index1].clientY
  const diffY2 = touch2.clientY - touchCache[index2].clientY
  let panX, panY, zoomX, zoomY
  panX = panY = zoomX = zoomY = 0

  if (diffX1 > 0 && diffX2 > 0) panX = -Math.min(diffX1, diffX2)
  else if (diffX1 < 0 && diffX2 < 0) panX = -Math.max(diffX1, diffX2)
  else zoomX = Math.abs(diffX1) + Math.abs(diffX2)

  if (diffY1 > 0 && diffY2 > 0) panY = -Math.min(diffY1, diffY2)
  else if (diffY1 < 0 && diffY2 < 0) panY = -Math.max(diffY1, diffY2)
  else zoomY = Math.abs(diffY1) + Math.abs(diffY2)

  if (twoFingerGesture === null) twoFingerGesture = (panX ** 2 + panY ** 2 > 0.1) ? 'pan' : 'zoom'

  if (twoFingerGesture === 'zoom') {
    const diff = (touch1.clientX - touch2.clientX) ** 2 + (touch1.clientY - touch2.clientY) ** 2 -
    ((touchCache[index1].clientX - touchCache[index2].clientX) ** 2 +
    (touchCache[index1].clientY - touchCache[index2].clientY) ** 2)
    const zoom = (diff > 0 ? 1 : -1) * Math.hypot(zoomX, zoomY) * 0.01
    if (!zoomCenter) {
      zoomCenter = {}
      zoomCenter.x = (touchCache[index1].clientX + touchCache[index2].clientX) / 2
      zoomCenter.y = (touchCache[index1].clientY + touchCache[index2].clientY) / 2
    }
    pz.zoom(1 + zoom, zoomCenter.x, zoomCenter.x)
  } else if (twoFingerGesture === 'pan') pz.pan(panX, panY)

  touchCache.length = 0
  touchCache.push(touch1, touch2)
}

canvas.ontouchstart = (evt) => {
  evt.preventDefault()
  // evt.stopPropagation()
  if (evt.targetTouches.length === 2) {
    if (mode === 'edit') drawingPath.cancel()
    touchCache.push(...evt.targetTouches)
    clearTimeout(touchTimer)
    touchTimer = null
    dragStart = dragging = false
    return
  }
  touchTimer = setTimeout(() => {
    menu.show(evt.touches[0].clientX, evt.touches[0].clientY)
    touchTimer = null
  }, touchDuration)
  lastTouch = evt.touches[0]
  if (evt.touches.length === 1) {
    dragStart = true
    dragging = false
    if (mode === 'edit') drawingPath = new PZPath(pz, conn, strokeSize)
  }
}

canvas.ontouchmove = (evt) => {
  evt.preventDefault()
  if (evt.targetTouches.length === 2) {
    handleTwoFinger(evt)
    return
  }
  const touch = evt.touches[0]
  if (menu.visible) {
    menu.ontouchmove(evt)
    return
  } else if (touchTimer) {
    if ((lastTouch.clientX - touch.clientX) ** 2 + (lastTouch.clientY - touch.clientY) ** 2 > 9) {
      clearTimeout(touchTimer)
      touchTimer = null
    } else return
  }

  if (!dragStart) return
  dragging = true
  let x, y
  switch (mode) {
    case 'edit': {
      const rect = evt.target.getBoundingClientRect()
      x = touch.clientX
      y = touch.clientY
      drawingPath.add(lastTouch.clientX - rect.left, lastTouch.clientY - rect.top, x - rect.left, y - rect.top)
      break
    }
    case 'pan':
      pz.pan(lastTouch.clientX - touch.clientX, lastTouch.clientY - touch.clientY)
      break
    default:
      break
  }
  lastTouch = touch
}

canvas.ontouchend = (evt) => {
  evt.preventDefault()
  // evt.stopPropagation()
  zoomCenter = null
  twoFingerGesture = null
  if (menu.visible) {
    menu.choose()
    return
  } else if (touchTimer) {
    clearTimeout(touchTimer)
    touchTimer = null
  }

  if (!dragStart) return
  dragStart = false
  if (mode === 'edit') {
    drawingPath.finish()
  }
  dragging = false
}

const strokeSizeStep = 5
function handleScroll (evt) {
  evt.preventDefault()
  if (dragStart) return
  const delta = evt.wheelDelta ? -evt.wheelDelta / 120 : evt.deltaY / 3

  if (evt.ctrlKey && mode === 'edit') {
    changeStrokeSize(evt.deltaY < 0 ? strokeSizeStep : -strokeSizeStep)
    return
  }
  pz.zoom(1 - delta / 10, evt.offsetX, evt.offsetY)
}

canvas.addEventListener('wheel', handleScroll, false)

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
