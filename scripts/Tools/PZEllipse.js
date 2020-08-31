import { Tool } from './Tool'

export class PZEllipse extends Tool {
  type = 'ellipse'

  draw (temp = false) {
    const ctx = temp ? this.pzCanvas.ctx : this.pzCanvas.shadowCtx
    const points = temp ? this.tempPoints : this.points
    const rx = Math.abs(points[0].x - points[1].x) / 2
    const ry = Math.abs(points[0].y - points[1].y) / 2
    const cx = Math.min(points[0].x, points[1].x) + rx
    const cy = Math.min(points[0].y, points[1].y) + ry
    ctx.save()
    ctx.strokeStyle = this.color
    ctx.lineWidth = this.width * (temp ? this.pzCanvas.scale : 1)
    ctx.lineCap = ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.restore()
  }
}
