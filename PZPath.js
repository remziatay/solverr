export class PZPath {
  constructor (pzCanvas, conn, x1, y1, x2, y2, width = 10, color = 'black') {
    this.pzCanvas = pzCanvas
    this.conn = conn
    this.width = width
    this.color = color
    this.path = new Path2D()
    this.points = []
    if (y2 !== undefined) this.add(x1, y1, x2, y2)
  }

  from ({ path, width, color }) {
    this.width = width
    this.color = color
    this.path.moveTo(path[0].x, path[0].y)
    for (let i = 1; i < path.length; i++) {
      this.path.lineTo(path[i].x, path[i].y)
      this.path.moveTo(path[i].x, path[i].y)
    }
    return this
  }

  add (x1, y1, x2, y2) {
    if (!this.points.length) {
      const p1 = this.pzCanvas.canvasToAddPoint(x1, y1)
      this.path.moveTo(p1.x, p1.y)
      this.points.push({ x: p1.x, y: p1.y })
    }
    const p2 = this.pzCanvas.canvasToAddPoint(x2, y2)
    this.path.lineTo(p2.x, p2.y)
    this.path.moveTo(p2.x, p2.y)
    this.points.push({ x: p2.x, y: p2.y })

    const ctx = this.pzCanvas.ctx
    ctx.save()
    ctx.strokeStyle = this.color
    ctx.lineWidth = this.width * this.pzCanvas.scale
    ctx.lineCap = ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.restore()
  }

  draw (temp = false) {
    const ctx = temp ? this.pzCanvas.ctx : this.pzCanvas.shadowCtx
    ctx.save()
    ctx.strokeStyle = this.color
    ctx.lineWidth = this.width * (temp ? this.pzCanvas.scale : 1)
    ctx.lineCap = ctx.lineJoin = 'round'
    ctx.stroke(this.path)
    ctx.restore()
  }

  finish () {
    const { scale, panX, panY, shadowCtx } = this.pzCanvas

    shadowCtx.save()
    shadowCtx.setTransform(scale, 0, 0, scale, panX, panY)
    this.draw()
    shadowCtx.restore()

    try {
      if (this.points.length) {
        this.conn.send({
          path: this.points,
          width: this.width,
          color: this.color,
          type: 'path'
        })
      }
    } catch (err) {
      console.error(err)
    }
    this.points = []
    this.pzCanvas.paths.push(this)
    this.pzCanvas.refresh()
  }

  cancel () {
    this.path = new Path2D()
    this.points = []
    this.pzCanvas.refresh()
  }
}
