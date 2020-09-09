import { Tool } from './Tool'

export class PZBrush extends Tool {
  path = new Path2D()
  type = 'brush'

  from ({ points, width, color }) {
    super.from({ points, width, color })
    this.path.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      this.path.lineTo(points[i].x, points[i].y)
      this.path.moveTo(points[i].x, points[i].y)
    }
    return this
  }

  startPoint (x, y, event = true) {
    super.startPoint(x, y, event)
    const p = this.points[0]
    this.path.moveTo(p.x, p.y)
    return this
  }

  movePoint (x, y, event = true) {
    if (window.devicePixelRatio !== 1 && event) {
      x *= window.devicePixelRatio
      y *= window.devicePixelRatio
    }
    this.pzCanvas.tempPath = this
    this.tempPoints.push({ x, y })

    const p = this.pzCanvas.convertPoint(x, y)
    this.path.lineTo(p.x, p.y)
    this.path.moveTo(p.x, p.y)
    this.points.push(p)

    return this
  }

  update () {
    if (!this.pzCanvas.isReady()) return
    const ctx = this.pzCanvas.ctx
    ctx.save()
    ctx.strokeStyle = this.color
    ctx.lineWidth = this.width * this.pzCanvas.scale
    ctx.lineCap = ctx.lineJoin = 'round'
    ctx.beginPath()
    const { x: x1, y: y1 } = this.tempPoints[this.tempPoints.length - 2]
    const { x: x2, y: y2 } = this.tempPoints[this.tempPoints.length - 1]
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
    if (temp) {
      this.tempPoints.forEach((p) => {
        ctx.beginPath()
        ctx.moveTo(p.x1, p.y1)
        ctx.lineTo(p.x2, p.y2)
        ctx.stroke()
      })
    } else ctx.stroke(this.path)
    ctx.restore()
  }
}
