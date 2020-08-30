export class Tool {
  constructor (pzCanvas, conn, width = 10, color = 'black') {
    this.pzCanvas = pzCanvas
    this.remote = true
    this.conn = conn
    this.width = width / pzCanvas.scale
    this.color = color
    this.tempPoints = []
    this.points = []
  }

  from ({ points, width, color }) {
    this.width = width
    this.color = color
    this.points = points
    this.remote = true
    return this
  }

  startPoint (x, y, event = true) {
    if (window.devicePixelRatio !== 1 && event) {
      x *= window.devicePixelRatio
      y *= window.devicePixelRatio
    }
    this.remote = false
    this.tempPoints = [{ x, y }]
    this.points = [this.pzCanvas.canvasToAddPoint(x, y)]
    return this
  }

  movePoint (x, y, event = true) {
    if (window.devicePixelRatio !== 1 && event) {
      x *= window.devicePixelRatio
      y *= window.devicePixelRatio
    }
    this.tempPoints[1] = { x, y }
    this.points[1] = this.pzCanvas.canvasToAddPoint(x, y)
    this.pzCanvas.tempPath = this

    return this
  }

  update () {
    if (!this.pzCanvas.isReady()) return
    this.pzCanvas.refresh()
    this.draw(true)
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
      if (!this.remote && this.points.length) {
        this.conn.send({
          points: this.points,
          width: this.width,
          color: this.color,
          type: this.type
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
