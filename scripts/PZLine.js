export class PZLine {
  constructor (pzCanvas, conn, width = 10, color = 'black') {
    this.pzCanvas = pzCanvas
    this.remote = true
    this.conn = conn
    this.width = width / pzCanvas.scale
    this.color = color
    this.points = []
    this.path = []
  }

  from ({ path, width, color }) {
    this.width = width
    this.color = color
    this.path = path
    this.remote = true
    return this
  }

  startPoint (x, y, event = true) {
    if (window.devicePixelRatio !== 1 && event) {
      x *= window.devicePixelRatio
      y *= window.devicePixelRatio
    }
    this.remote = false
    this.points[0] = { x, y }
    this.path[0] = this.pzCanvas.canvasToAddPoint(x, y)
    return this
  }

  endPoint (x, y, event = true) {
    if (window.devicePixelRatio !== 1 && event) {
      x *= window.devicePixelRatio
      y *= window.devicePixelRatio
    }
    this.points[1] = { x, y }
    this.path[1] = this.pzCanvas.canvasToAddPoint(x, y)
    this.pzCanvas.tempPath = this

    if (!this.pzCanvas.isReady()) return
    this.pzCanvas.refresh()
    this.draw(true)
  }

  draw (temp = false) {
    const ctx = temp ? this.pzCanvas.ctx : this.pzCanvas.shadowCtx
    const points = temp ? this.points : this.path
    ctx.save()
    ctx.strokeStyle = this.color
    ctx.lineWidth = this.width * (temp ? this.pzCanvas.scale : 1)
    ctx.lineCap = ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    ctx.lineTo(points[1].x, points[1].y)
    ctx.stroke()
    ctx.restore()
  }

  finish () {
    const { scale, panX, panY, shadowCtx } = this.pzCanvas
    if (!this.remote) this.pzCanvas.tempPath = null
    if (this.pzCanvas.isReady()) {
      shadowCtx.save()
      shadowCtx.setTransform(scale, 0, 0, scale, panX, panY)
      this.draw()
      shadowCtx.restore()
    }

    try {
      if (!this.remote && this.path.length) {
        this.conn.send({
          path: this.path,
          width: this.width,
          color: this.color,
          type: 'line'
        })
      }
    } catch (err) {
      console.error(err)
    }

    this.pzCanvas.paths.push(() => this.draw())
    this.pzCanvas.refresh()
  }

  cancel () {
    if (!this.remote) this.pzCanvas.tempPath = null
    this.pzCanvas.refresh()
  }
}
