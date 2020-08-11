export class PZImage {
  constructor (pzCanvas, conn, remote = false) {
    this.pzCanvas = pzCanvas
    this.remote = remote
    if (!remote) pzCanvas.tempPath = this
    this.conn = conn
    this.end = (evt) => this.finish(evt)
  }

  from ({ base64Image, x, y, scale }) {
    this.x = x
    this.y = y
    this.scale = scale
    this.image = new Image()
    this.image.onload = () => {
      this.draw()
      this.pzCanvas.paths.push(this)
      this.pzCanvas.refresh()
    }
    this.image.src = base64Image
  }

  start (file) {
    const reader = new FileReader()
    reader.onloadend = () => {
      this.base64Image = reader.result
      this.oldMouseDown = this.pzCanvas.canvas.onmousedown
      this.oldMouseMove = this.pzCanvas.canvas.onmousemove
      this.oldMouseUp = this.pzCanvas.canvas.onmouseup
      this.oldTouchStart = this.pzCanvas.canvas.ontouchstart
      this.oldTouchMove = this.pzCanvas.canvas.ontouchmove
      this.oldTouchEnd = this.pzCanvas.canvas.ontouchend

      this.image = new Image()
      this.image.onload = () => this.onImageLoad()
      this.image.src = URL.createObjectURL(file)
    }
    reader.readAsDataURL(file)
  }

  onImageLoad () {
    const { canvas, width, height } = this.pzCanvas
    this.scale =
      Math.min(width / this.image.width, height / this.image.height, 1) - 0.01
    this.x = (canvas.width - this.image.width * this.scale) / 2
    this.y = (canvas.height - this.image.height * this.scale) / 2
    this.width = this.image.width * this.scale
    this.height = this.image.height * this.scale
    this.r = 7 // Tolerance

    this.drawFaded()

    this.dragStart = false
    this.dragging = false
    this.mode = 'end'

    canvas.onmousedown = (evt) => this.newOnMouseDown(evt)
    canvas.onmousemove = (evt) => this.newOnMouseMove(evt)
    canvas.onmouseup = (evt) => this.newOnMouseUp(evt)
    canvas.ontouchstart = (evt) => this.newOnTouchStart(evt)
    canvas.ontouchmove = (evt) => this.newOnTouchMove(evt)
    canvas.ontouchend = (evt) => this.newOnTouchEnd(evt)
    document.addEventListener('click', this.end)
  }

  drawFaded (refresh = true) {
    const ctx = this.pzCanvas.ctx
    const { image, width, height, x, y, r } = this
    if (refresh) this.pzCanvas.refresh(false)
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

  newOnTouchStart (evt) {
    evt.preventDefault()
    if (evt.touches.length !== 1) return
    const rect = evt.target.getBoundingClientRect()
    const { width, height, x, y, r } = this
    this.lastTouch = evt.touches[0]
    const dx = evt.touches[0].clientX - rect.left - x
    const dy = evt.touches[0].clientY - rect.top - y
    if ((dx - width) ** 2 + (dy - height) ** 2 <= r ** 2) this.mode = 'nwse-resize'
    else if (dx < width && dx > 0 && dy < height && dy > 0) this.mode = 'move'
    else this.mode = 'auto'
    this.newOnMouseDown({ buttons: 1 })
  }

  newOnTouchMove (evt) {
    evt.preventDefault()
    if (evt.touches.length !== 1) return
    const touch = evt.touches[0]
    const rect = evt.target.getBoundingClientRect()
    this.newOnMouseMove({
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top,
      movementX: touch.clientX - this.lastTouch.clientX,
      movementY: touch.clientY - this.lastTouch.clientY
    })
    this.lastTouch = touch
  }

  newOnTouchEnd (evt) {
    evt.preventDefault()
    this.lastTouch = null
    if (!this.dragStart) return
    this.dragStart = false
    if (this.mode === 'auto') this.finish()
    this.dragging = false
  }

  newOnMouseDown (evt) {
    if (evt.buttons !== 1) return false
    this.dragStart = true
    this.dragging = false
  }

  newOnMouseMove (evt) {
    document.getElementById('status-text').innerText = evt.offsetX + '-' + evt.offsetX + '-' + evt.movementX + '-' + evt.movementY

    const { image, width, height, x, y, r } = this
    const canvas = this.pzCanvas.canvas
    if (!this.dragStart) {
      const dx = evt.offsetX - x
      const dy = evt.offsetY - y
      if ((dx - width) ** 2 + (dy - height) ** 2 <= r ** 2) { canvas.style.cursor = this.mode = 'nwse-resize' } else if (dx < width && dx > 0 && dy < height && dy > 0) { canvas.style.cursor = this.mode = 'move' } else canvas.style.cursor = this.mode = 'auto'
      return
    }
    this.dragging = true
    if (this.mode === 'move') {
      this.x += evt.movementX
      this.y += evt.movementY
    } else if (this.mode === 'nwse-resize') {
      if (Math.abs(evt.movementX) > Math.abs(evt.movementY)) { this.scale *= 1 + evt.movementX / width } else this.scale *= 1 + evt.movementY / height
      this.width = image.width * this.scale
      this.height = image.height * this.scale
    }

    this.drawFaded()
  }

  newOnMouseUp (evt) {
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
    document.body.removeEventListener('click', this.end)
    canvas.onmousedown = this.oldMouseDown
    canvas.onmousemove = this.oldMouseMove
    canvas.onmouseup = this.oldMouseUp
    canvas.ontouchstart = this.oldTouchStart
    canvas.ontouchmove = this.oldTouchMove
    canvas.ontouchend = this.oldTouchEnd
    canvas.style.cursor = 'auto'
    const p = this.pzCanvas.canvasToAddPoint(this.x, this.y)
    this.x = p.x
    this.y = p.y
    this.scale /= this.pzCanvas.scale
    try {
      this.conn.send({
        base64Image: this.base64Image,
        x: this.x,
        y: this.y,
        scale: this.scale,
        type: 'image'
      })
    } catch (err) {
      console.error(err)
    }

    this.draw()
    this.pzCanvas.paths.push(this)
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
