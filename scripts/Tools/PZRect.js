import { Tool } from './Tool'

export class PZRect extends Tool {
  type = 'rect'

  draw (temp = false) {
    const ctx = temp ? this.pzCanvas.ctx : this.pzCanvas.shadowCtx
    const points = temp ? this.tempPoints : this.points
    const x = Math.min(points[0].x, points[1].x)
    const y = Math.min(points[0].y, points[1].y)
    const width = Math.abs(points[0].x - points[1].x)
    const height = Math.abs(points[0].y - points[1].y)
    ctx.save()
    ctx.strokeStyle = this.color
    ctx.lineWidth = this.width * (temp ? this.pzCanvas.scale : 1)
    ctx.lineCap = ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.stroke()
    ctx.restore()
  }
}
