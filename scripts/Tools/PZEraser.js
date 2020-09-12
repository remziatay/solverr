import { PZBrush } from './PZBrush'

export class PZEraser extends PZBrush {
  path = new Path2D()
  type = 'eraser'

  from ({ points, width }) {
    super.from({ points, width })
    return this
  }

  update () {
    if (!this.pzCanvas.isReady()) return
    const ctx = this.pzCanvas.ctx
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
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
    ctx.globalCompositeOperation = 'destination-out'
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
