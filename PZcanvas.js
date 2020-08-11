export class PZcanvas {
  constructor (width, height, area) {
    this.width = width
    this.height = height
    this.area = area
    this.paths = []
    this.scale = 1

    this.refX = (width * (area - 1)) / 2
    this.refY = (height * (area - 1)) / 2
    this.panX = 0
    this.panY = 0
    this.centerX = (width * area) / 2
    this.centerY = (height * area) / 2

    this.canvas = document.createElement('canvas')
    this.canvas.width = width
    this.canvas.height = height
    this.ctx = this.canvas.getContext('2d')

    this.shadowCanvas = document.createElement('canvas')
    this.shadowCanvas.width = width * area
    this.shadowCanvas.height = height * area
    this.shadowCtx = this.shadowCanvas.getContext('2d')
    // this.shadowCtx.translate(this.refX, this.refY);
    this.halfZoom = {
      rx: this.refX,
      ry: this.refY,
      x: 0,
      y: 0,
      zoom: 1
    }

    this.update()
    this.refresh()

    this.unfinishedPath = null
    this.trim = (num, min, max) => Math.min(max, Math.max(min, num))
    this.shadowCanvas.onmousemove = (evt) => {
      if (evt.shiftKey) {
        console.clear()
        console.log(this.real2canvas(evt.offsetX, evt.offsetY))
      }
    }
  }

  clear () {
    const { width, height, area } = this
    this.paths = []
    this.unfinishedPath = null
    this.scale = 1

    this.refX = (width * (area - 1)) / 2
    this.refY = (height * (area - 1)) / 2
    this.panX = 0
    this.panY = 0
    this.centerX = (width * area) / 2
    this.centerY = (height * area) / 2

    this.update()
    this.refresh()
  }

  canvasToAddPoint (x, y) {
    const { refX, panX, refY, panY, scale } = this
    return { x: (x + refX - panX) / scale, y: (y + refY - panY) / scale }
  }
  /*
  canvasToDrawPoint (x, y) {
    return this.transformedPoint(this.refX + x, this.refY + y)
  }
  */

  dose () {
    const ctx = this.shadowCtx
    for (let i = 0; i <= ctx.canvas.width + 2000; i += 50) {
      for (let j = 0; j <= ctx.canvas.height + 2000; j += 50) {
        ctx.fillRect(i, j, 1, 1)
        ctx.fillText(i / 50 + ',' + j / 50, i, j)
      }
    }
  }

  update () {
    const { width, height, area, shadowCanvas, shadowCtx, panX, panY, scale } = this
    requestAnimationFrame(() => {
      shadowCtx.save()
      shadowCtx.setTransform(1, 0, 0, 1, 0, 0)
      shadowCtx.translate(panX, panY)
      shadowCtx.scale(scale, scale)
      shadowCtx.lineWidth = 1 / scale
      shadowCtx.clearRect(0, 0, shadowCanvas.width, shadowCanvas.height)
      this.dose()
      shadowCtx.strokeRect(0, 0, width * area, height * area)
      this.paths.forEach((path) => path.draw())
      shadowCtx.restore()
      this.refresh()
    })
  }

  pan (dx, dy) {
    const { width, height, area, scale, refX, refY } = this
    dx = this.trim(
      dx,
      this.panX - refX,
      scale * width * area - (refX + width) + this.panX
    )
    dy = this.trim(
      dy,
      this.panY - refY,
      scale * height * area - (refY + height) + this.panY
    )
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return
    const overX = this.trim(dx, -refX, this.shadowCanvas.width - width - refX)
    const overY = this.trim(
      dy,
      -refY,
      this.shadowCanvas.height - height - refY
    )
    this.refX += dx
    this.refY += dy
    if (Math.abs(dx - overX) >= 1 || Math.abs(dy - overY) >= 1) {
      const x = this.refX
      const y = this.refY
      this.refX = (this.width * (this.area - 1)) / 2
      this.refY = (this.height * (this.area - 1)) / 2

      this.panX -= x - this.refX
      this.panY -= y - this.refY

      // shadowCtx.translate(-(x - this.refX), -(y - this.refY));
      this.fixOverFlow()
      this.update()
    }
    // shadowCtx.translate(dx, dy); // NOT NECESSARY I GUESS
    this.halfZoom.rx = this.refX
    this.halfZoom.ry = this.refY
    this.refresh()
  }

  zoom (scale, x, y) {
    const { shadowCtx } = this
    scale = this.trim(scale, 1 / (this.scale * this.area), 20 / this.scale)
    if (scale === 1) return
    clearTimeout(this.zoomDebounceTimeout)
    this.halfZoom = { ...this.halfZoom, x, y, zoom: this.halfZoom.zoom * scale }
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
    this.refX = (this.width * (this.area - 1)) / 2
    this.refY = (this.height * (this.area - 1)) / 2
    pt = this.real2canvas(x, y)
    shadowCtx.restore()
    this.panX -= (pt2.x - pt.x) / this.scale
    this.panY -= (pt2.y - pt.y) / this.scale

    this.zoomDebounceTimeout = setTimeout(() => {
      // panning and reversing so the overflow will be fixed
      this.halfZoom.zoom = 1
      this.pan(1, 1)
      this.pan(-1, -1)
      this.update()
    }, 300)
  }

  fixOverFlow () {
    const { panX, panY } = this
    if (panX > 0) {
      this.refX -= this.panX
      this.panX = 0
      // shadowCtx.translate(-this.panX, 0);
    }
    if (panY > 0) {
      this.refY -= this.panY
      this.panY = 0
      // shadowCtx.translate(0, -this.panY);
    }
    if (panX < -this.shadowCanvas.width * (this.scale - 1)) {
      const diff = this.panX + this.shadowCanvas.width * (this.scale - 1)
      this.refX -= diff
      this.panX -= diff
      // shadowCtx.translate(-diff, 0);
    }
    if (panY < -this.shadowCanvas.height * (this.scale - 1)) {
      const diff = this.panY + this.shadowCanvas.height * (this.scale - 1)
      this.refY -= diff
      this.panY -= diff
      // shadowCtx.translate(0, -diff);
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

  refresh () {
    const { width, height, ctx, shadowCanvas, refX, refY } = this
    const { rx, ry, x, y, zoom } = this.halfZoom
    const hx = zoom === 1 ? 0 : (-refX + rx + x - x / zoom)
    const hy = zoom === 1 ? 0 : (-refY + ry + y - y / zoom)
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(
      shadowCanvas,
      refX + hx,
      refY + hy,
      width / zoom,
      height / zoom,
      0,
      0,
      width,
      height
    )
  }
}
