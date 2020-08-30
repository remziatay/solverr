import { Tool } from './Tool'

export class PZLine extends Tool {
  type = 'line'

  draw (temp = false) {
    const ctx = temp ? this.pzCanvas.ctx : this.pzCanvas.shadowCtx
    const points = temp ? this.tempPoints : this.points
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
}
