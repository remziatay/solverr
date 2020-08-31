import { Tool } from './Tool'

export class PZCircle extends Tool {
  type = 'circle'

  draw (temp = false) {
    const ctx = temp ? this.pzCanvas.ctx : this.pzCanvas.shadowCtx
    const points = temp ? this.tempPoints : this.points
    const r = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) / 2
    const cx = Math.min(points[0].x, points[1].x) + Math.abs(points[0].x - points[1].x) / 2
    const cy = Math.min(points[0].y, points[1].y) + Math.abs(points[0].y - points[1].y) / 2
    ctx.save()
    ctx.strokeStyle = this.color
    ctx.lineWidth = this.width * (temp ? this.pzCanvas.scale : 1)
    ctx.lineCap = ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.restore()
  }
}
