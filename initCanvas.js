import { PZcanvas } from './PZcanvas.js'
import { TouchHandler } from './touchHandler.js'
import { CircleContextMenu } from './CircleContextMenu.js'
import { PZPath } from './PZPath.js'

const canvas = document.getElementById('main-canvas')
let pz, conn
let dragStart = false
let dragging = false
let drawingPath
let strokeSize = 10
let mode = 'edit' // edit or pan
if (mode === 'edit') changeStrokeSize(0)
else if (mode === 'pan') canvas.style.cursor = 'grab'
const touchHandler = new TouchHandler(500, 3)
const menu = new CircleContextMenu(200)

export function initCanvas (connection) {
  conn = connection
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
  canvas.oncontextmenu = evt => evt.preventDefault()
  canvas.style.border = '1px solid green'
  canvas.hidden = false
  return pz
}

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
  (zoom, center) => pz.zoom(1 + zoom * 0.005, center.x, center.y),
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

menu.canvas.onmouseup = () => menu.choose()

window.addEventListener('resize', () => {
  menu.resize()
  if (pz) pz.resize()
})

menu.addButton('Pan', () => {
  mode = 'pan'
  canvas.style.cursor = 'grab'
})

menu.addButton('Draw', () => {
  mode = 'edit'
  changeStrokeSize(0)
})
