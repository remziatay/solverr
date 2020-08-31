import { TouchHandler } from '../touchHandler.js'

export class PZImage {
  constructor (pzCanvas, conn, remote = false) {
    this.pzCanvas = pzCanvas
    this.remote = remote
    if (!remote) pzCanvas.tempPath = this
    this.conn = conn
    this.setCursor = () => true
    this.end = (evt) => { if (this.mode === 'auto') this.finish(evt) }
    this.touchHandler = new TouchHandler()
    this.touchHandler.addGestureListener('drag',
      (touch, lastTouch, evt) => this.touchMove(touch, lastTouch, evt),
      (evt) => this.touchStart(evt),
      () => { if (this.mode === 'auto') this.finish() }
    )
    this.touchHandler.addGestureListener('twoFingerZoom',
      (zoom, center, evt) => {
        const rect = evt.target.getBoundingClientRect()
        zoom *= 0.005
        this.scale *= 1 + zoom
        this.width = this.image.width * this.scale
        this.height = this.image.height * this.scale
        this.x -= ((center.x - rect.left) * window.devicePixelRatio - this.x) * zoom
        this.y -= ((center.y - rect.top) * window.devicePixelRatio - this.y) * zoom
        this.drawFaded()
      }
    )
  }

  after (callback) {
    this.finally = callback
    return this
  }

  from ({ base64Image, x, y, scale }) {
    this.x = x
    this.y = y
    this.scale = scale
    this.image = new Image()
    this.image.onload = () => {
      this.pzCanvas.paths.push(() => this.draw())
      if (!this.pzCanvas.isReady()) return
      this.draw()
      this.pzCanvas.refresh()
    }
    this.image.src = base64Image
  }

  start (file) {
    const reader = new FileReader()
    reader.onloadend = () => {
      this.base64Image = reader.result
      this.oldCursor = this.pzCanvas.canvas.style.cursor

      this.image = new Image()
      this.image.onload = () => this.onImageLoad()
      this.image.src = URL.createObjectURL(file)
    }
    reader.readAsDataURL(file)
    return this
  }

  onImageLoad () {
    const { canvas, width, height } = this.pzCanvas
    this.scale =
      Math.min(width / this.image.width, height / this.image.height, 1) - 0.01
    this.x = (canvas.width - this.image.width * this.scale) / 2
    this.y = (canvas.height - this.image.height * this.scale) / 2
    this.width = this.image.width * this.scale
    this.height = this.image.height * this.scale
    this.r = 8 * window.devicePixelRatio ** 1.5// Tolerance

    this.drawFaded()

    this.dragStart = false
    this.dragging = false
    this.mode = 'end'

    document.addEventListener('click', this.end)
  }

  getNewListeners () {
    return {
      onMouseDown: (evt) => this.newOnMouseDown(evt),
      onMouseMove: (evt) => this.newOnMouseMove(evt),
      onMouseUp: (evt) => this.newOnMouseUp(evt),
      onTouchStart: this.touchHandler.onTouchStart,
      onTouchMove: this.touchHandler.onTouchMove,
      onTouchEnd: this.touchHandler.onTouchEnd,
      onWheel: (evt) => this.newScroll(evt)
    }
  }

  drawFaded (refresh = true) {
    const ctx = this.pzCanvas.ctx
    const { image, width, height, x, y, r } = this
    if (refresh) this.pzCanvas.refresh(false)
    if (!this.pzCanvas.isReady()) return
    ctx.save()
    ctx.globalAlpha = 0.5
    ctx.drawImage(image, 0, 0, image.width, image.height, x, y, width, height)
    ctx.fillStyle = 'rgba(100, 100, 100)'
    ctx.fillRect(x, y, width, height)
    ctx.globalAlpha = 1
    ctx.beginPath()
    ctx.fillStyle = '#7FDBFF'
    ctx.shadowOffsetX = ctx.shadowOffsetY = 1
    ctx.shadowColor = 'gray'
    ctx.arc(x + width, y + height, r, 0, 2 * Math.PI)
    ctx.fill()
    ctx.restore()
  }

  newScroll (evt) {
    evt.preventDefault()
    if (this.dragStart) return
    const delta = evt.wheelDelta ? -evt.wheelDelta / 120 : evt.deltaY / 3
    this.scale *= 1 - delta / 10
    this.width = this.image.width * this.scale
    this.height = this.image.height * this.scale
    this.x -= (evt.nativeEvent.offsetX * window.devicePixelRatio - this.x) * -delta / 10
    this.y -= (evt.nativeEvent.offsetY * window.devicePixelRatio - this.y) * -delta / 10
    this.drawFaded()
  }

  touchStart (evt) {
    const rect = evt.target.getBoundingClientRect()
    const { width, height, x, y, r } = this
    const dx = window.devicePixelRatio * (evt.touches[0].clientX - rect.left) - x
    const dy = window.devicePixelRatio * (evt.touches[0].clientY - rect.top) - y
    if ((dx - width) ** 2 + (dy - height) ** 2 <= r ** 2) this.mode = 'nwse-resize'
    else if (dx < width && dx > 0 && dy < height && dy > 0) this.mode = 'move'
    else this.mode = 'auto'
    this.newOnMouseDown({ buttons: 1 })
  }

  touchMove (touch, lastTouch, evt) {
    const rect = evt.target.getBoundingClientRect()
    this.newOnMouseMove({
      nativeEvent: {
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
      }
    }, touch.clientX - lastTouch.clientX, touch.clientY - lastTouch.clientY)
  }

  newOnMouseDown (evt) {
    if (evt.buttons !== 1) return false
    evt.target.setPointerCapture(evt.pointerId)
    this.lastXY = { x: evt.nativeEvent.offsetX, y: evt.nativeEvent.offsetY }
    this.dragStart = true
    this.dragging = false
  }

  newOnMouseMove (evt, movementX, movementY) {
    const { image, width, height, x, y, r } = this
    if (!this.dragStart) {
      const dx = evt.nativeEvent.offsetX * window.devicePixelRatio - x
      const dy = evt.nativeEvent.offsetY * window.devicePixelRatio - y
      if ((dx - width) ** 2 + (dy - height) ** 2 <= r ** 2) {
        this.setCursor('nwse-resize')
        this.mode = 'nwse-resize'
      } else if (dx < width && dx > 0 && dy < height && dy > 0) {
        this.setCursor('move')
        this.mode = 'move'
      } else {
        this.setCursor('auto')
        this.mode = 'auto'
      }
      return
    }
    movementX = movementX || evt.nativeEvent.offsetX - this.lastXY.x
    movementY = movementY || evt.nativeEvent.offsetY - this.lastXY.y
    this.dragging = true
    if (this.mode === 'move') {
      this.x += movementX * window.devicePixelRatio
      this.y += movementY * window.devicePixelRatio
    } else if (this.mode === 'nwse-resize') {
      if (Math.abs(movementX) > Math.abs(movementY)) {
        this.scale *= 1 + (movementX * window.devicePixelRatio) / width
      } else this.scale *= 1 + (movementY * window.devicePixelRatio) / height
      this.width = image.width * this.scale
      this.height = image.height * this.scale
    }

    this.drawFaded()
    this.lastXY = { x: evt.nativeEvent.offsetX, y: evt.nativeEvent.offsetY }
  }

  newOnMouseUp (evt) {
    evt.target.releasePointerCapture(evt.pointerId)
    if (!this.dragStart) return
    this.dragStart = false
    if (this.mode === 'auto') this.finish()
    else if (!this.dragging) {
      const canvas = this.pzCanvas.canvas
      const scaleFactor = evt.shiftKey ? 0.9 : 1.1
      this.scale *= scaleFactor
      this.x -= (canvas.width / 2 - this.x) * (scaleFactor - 1)
      this.y -= (canvas.height / 2 - this.y) * (scaleFactor - 1)
      this.width = this.image.width * this.scale
      this.height = this.image.height * this.scale
      this.drawFaded()
    }
    this.dragging = false
  }

  finish (evt) {
    const canvas = this.pzCanvas.canvas
    if (evt && evt.target === canvas) return
    if (!this.remote) this.pzCanvas.tempPath = null
    document.removeEventListener('click', this.end)
    this.finally()
    this.setCursor(this.oldCursor)
    const p = this.pzCanvas.canvasToAddPoint(this.x, this.y)
    this.x = p.x
    this.y = p.y
    this.scale /= this.pzCanvas.scale
    try {
      if (!this.remote) {
        this.conn.send({
          base64Image: this.base64Image,
          x: this.x,
          y: this.y,
          scale: this.scale,
          type: 'image'
        })
      }
    } catch (err) {
      console.error(err)
    }

    this.pzCanvas.paths.push(() => this.draw())
    if (!this.pzCanvas.isReady()) return
    this.draw()
    this.pzCanvas.refresh()
  }

  draw (temp = false) {
    if (temp) {
      this.drawFaded(false)
      return
    }
    const { shadowCtx, panX, panY, scale } = this.pzCanvas
    const { image, x, y } = this
    shadowCtx.save()
    shadowCtx.setTransform(scale, 0, 0, scale, panX, panY)
    shadowCtx.drawImage(
      image,
      0,
      0,
      image.width,
      image.height,
      x,
      y,
      image.width * this.scale,
      image.height * this.scale
    )
    shadowCtx.restore()
  }
}
