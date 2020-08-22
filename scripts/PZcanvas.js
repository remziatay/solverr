export class PZcanvas {
  constructor (canvas, shadowWidth, shadowHeight) {
    canvas.width *= window.devicePixelRatio
    canvas.height *= window.devicePixelRatio
    this.width = canvas.width
    this.height = canvas.height
    this.shadowWidth = shadowWidth
    this.shadowHeight = shadowHeight

    this.canvas = canvas
    this.ctx = this.canvas.getContext('2d')

    this.shadowCanvas = document.createElement('canvas')
    this.shadowCanvas.width = shadowWidth
    this.shadowCanvas.height = shadowHeight
    this.shadowCtx = this.shadowCanvas.getContext('2d')
    this.trim = (num, min, max) => Math.min(max, Math.max(min, num))

    this.clear()
  }

  clear () {
    const { width, height, shadowWidth, shadowHeight, shadowCtx } = this
    this.paths = []
    this.tempPath = null
    this.scale = 1

    this.refX = (shadowWidth - width) / 2
    this.refY = (shadowHeight - height) / 2
    this.panX = 0
    this.panY = 0

    this.halfZoom = { zoom: 1 }
    shadowCtx.resetTransform()
    this.update()
  }

  resize () {
    const { canvas } = this
    const oddify = num => num - num % 2
    canvas.style.width = canvas.style.height = ''
    const nWidth = oddify(canvas.offsetWidth)
    const nHeight = oddify(canvas.offsetHeight)
    canvas.style.width = nWidth + 'px'
    canvas.style.height = nHeight + 'px'
    canvas.width = oddify(Math.ceil(nWidth * window.devicePixelRatio))
    canvas.height = oddify(Math.ceil(nHeight * window.devicePixelRatio))
    if (canvas.width > this.shadowCanvas.width) this.shadowCanvas.width = canvas.width
    if (canvas.height > this.shadowCanvas.height) this.shadowCanvas.height = canvas.height
    this.refX -= (canvas.width - this.width) / 2
    this.refY -= (canvas.height - this.height) / 2
    this.width = canvas.width
    this.height = canvas.height
    this.pan(-1, -1)
    this.pan(1, 1)
    this.update()
  }

  isReady () {
    return this.halfZoom.zoom === 1
  }

  canvasToAddPoint (x, y) {
    const { refX, panX, refY, panY, scale } = this
    return { x: (x + refX - panX) / scale, y: (y + refY - panY) / scale }
  }

  dose () {
    const ctx = this.shadowCtx
    for (let i = 0; i <= this.shadowWidth + 50; i += 50) {
      for (let j = 0; j <= this.shadowHeight + 50; j += 50) {
        ctx.fillRect(i, j, 1, 1)
        ctx.fillText(i / 50 + ',' + j / 50, i, j)
      }
    }
  }

  update () {
    const { shadowWidth, shadowHeight, shadowCtx, panX, panY, scale } = this
    this.clearZoomTimeout()
    this.halfZoom.zoom = 1
    requestAnimationFrame(() => {
      shadowCtx.save()
      shadowCtx.setTransform(1, 0, 0, 1, 0, 0)
      shadowCtx.clearRect(0, 0, shadowWidth, shadowHeight)
      shadowCtx.translate(panX, panY)
      shadowCtx.scale(scale, scale)
      shadowCtx.lineWidth = 1 / scale
      this.dose()
      shadowCtx.strokeRect(0, 0, shadowWidth, shadowHeight)
      this.paths.forEach(draw => draw())
      shadowCtx.restore()
      this.refresh()
    })
  }

  pan (dx, dy, event = true) {
    if (window.devicePixelRatio !== 1 && event) {
      dx *= window.devicePixelRatio
      dy *= window.devicePixelRatio
    }
    const { width, height, shadowWidth, shadowHeight, scale, refX, refY } = this
    dx = this.trim(dx, this.panX - refX, scale * shadowWidth - (refX + width) + this.panX)
    dy = this.trim(dy, this.panY - refY, scale * shadowHeight - (refY + height) + this.panY)
    if (Math.abs(dx) < 1) dx = 0
    if (Math.abs(dy) < 1) dy = 0
    if (!dx && !dy) return
    this.clearZoomTimeout()
    const overX = this.trim(dx, -refX, shadowWidth - width - refX)
    const overY = this.trim(dy, -refY, shadowHeight - height - refY)
    this.refX += dx
    this.refY += dy
    if (Math.abs(dx - overX) >= 1 || Math.abs(dy - overY) >= 1) {
      const x = this.refX
      const y = this.refY
      this.refX = (shadowWidth - width) / 2
      this.refY = (shadowHeight - height) / 2

      this.panX -= x - this.refX
      this.panY -= y - this.refY

      this.fixOverFlow()
      this.update()
    }
    this.halfZoom.rx += dx / this.halfZoom.zoom
    this.halfZoom.ry += dy / this.halfZoom.zoom
    this.refresh()
    if (this.halfZoom.zoom !== 1) this.setZoomTimeout()
  }

  zoom (scale, x, y, event = true) {
    if (window.devicePixelRatio !== 1 && event) {
      x *= window.devicePixelRatio
      y *= window.devicePixelRatio
    }
    const { shadowCtx, width, height, shadowWidth, shadowHeight, halfZoom } = this
    scale = this.trim(scale, 1 / (this.scale * Math.min(shadowWidth / width, shadowHeight / height)), 20 / this.scale)
    if (scale === 1) return
    this.clearZoomTimeout()
    if (halfZoom.zoom === 1) {
      halfZoom.rx = this.refX + x * (1 - 1 / scale)
      halfZoom.ry = this.refY + y * (1 - 1 / scale)
      halfZoom.zoom = scale
    } else {
      halfZoom.rx += x * (1 - 1 / scale) / halfZoom.zoom
      halfZoom.ry += y * (1 - 1 / scale) / halfZoom.zoom
      halfZoom.zoom *= scale
    }
    this.refresh()
    let pt = this.real2canvas(x, y)
    shadowCtx.scale(scale, scale)
    shadowCtx.save()
    const pt2 = this.real2canvas(x, y)
    this.panX -= (pt2.x - pt.x) / this.scale
    this.panY -= (pt2.y - pt.y) / this.scale
    shadowCtx.translate(
      -(pt2.x - pt.x) / this.scale,
      -(pt2.y - pt.y) / this.scale
    )
    this.scale *= scale
    pt = this.real2canvas(x, y)
    this.refX = (shadowWidth - width) / 2
    this.refY = (shadowHeight - height) / 2
    pt = this.real2canvas(x, y)
    shadowCtx.restore()
    this.panX -= (pt2.x - pt.x) / this.scale
    this.panY -= (pt2.y - pt.y) / this.scale
    this.setZoomTimeout()
  }

  setZoomTimeout () {
    this.zoomDebounceTimeout = setTimeout(() => {
      // panning and reversing so the overflow will be fixed
      this.zoomDebounceTimeout = null
      this.halfZoom.zoom = 1
      this.pan(1, 1)
      this.pan(-1, -1)
      this.update()
    }, 500)
  }

  clearZoomTimeout () {
    if (!this.zoomDebounceTimeout) return
    clearTimeout(this.zoomDebounceTimeout)
    this.zoomDebounceTimeout = null
  }

  fixOverFlow () {
    const { panX, panY } = this
    if (panX > 0) {
      this.refX -= this.panX
      this.panX = 0
    }
    if (panY > 0) {
      this.refY -= this.panY
      this.panY = 0
    }
    if (panX < -this.shadowWidth * (this.scale - 1)) {
      const diff = this.panX + this.shadowWidth * (this.scale - 1)
      this.refX -= diff
      this.panX -= diff
    }
    if (panY < -this.shadowHeight * (this.scale - 1)) {
      const diff = this.panY + this.shadowHeight * (this.scale - 1)
      this.refY -= diff
      this.panY -= diff
    }
  }

  /*
  transformedPoint (x, y) {
    const inv = this.shadowCtx.getTransform().invertSelf()
    x = inv.a * x + inv.c * y + inv.e
    y = inv.b * x + inv.d * y + inv.f
    return { x, y }
  }
  */

  real2canvas (x, y) {
    x += this.refX - this.panX
    y += this.refY - this.panY
    const inv = this.shadowCtx.getTransform()
    return {
      x: inv.a * x + inv.c * y + inv.e,
      y: inv.b * x + inv.d * y + inv.f
    }
  }

  refresh (tempControl = true) {
    const { width, height, ctx, shadowCanvas, refX, refY } = this
    const { rx, ry, zoom } = this.halfZoom
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(
      shadowCanvas,
      zoom === 1 ? refX : rx,
      zoom === 1 ? refY : ry,
      width / zoom,
      height / zoom,
      0,
      0,
      width,
      height
    )
    if (this.tempPath && tempControl && zoom === 1) this.tempPath.draw(true)
  }
}
