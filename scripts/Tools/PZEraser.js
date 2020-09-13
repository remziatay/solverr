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
    const ctx = this.pzCanvas.shadowCtx
    ctx.save()
    ctx.setTransform(this.pzCanvas.scale, 0, 0, this.pzCanvas.scale, this.pzCanvas.panX, this.pzCanvas.panY)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineWidth = this.width
    ctx.lineCap = ctx.lineJoin = 'round'
    ctx.beginPath()
    const { x: x1, y: y1 } = this.points[this.points.length - 2]
    const { x: x2, y: y2 } = this.points[this.points.length - 1]
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    this.pzCanvas.drawImage?.()
    ctx.restore()
    this.pzCanvas.refresh(false)
  }

  draw () {
    const ctx = this.pzCanvas.shadowCtx
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineWidth = this.width
    ctx.lineCap = ctx.lineJoin = 'round'
    ctx.stroke(this.path)
    ctx.restore()
  }
}
