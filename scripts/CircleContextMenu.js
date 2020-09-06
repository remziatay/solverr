export class CircleContextMenu {
  constructor ({
    r = 200,
    background = 'red',
    color = 'white',
    chosenBackground = 'blue',
    chosenColor = color,
    font = '35px sans-serif'
  } = {}) {
    Object.assign(this, { r, background, color, chosenBackground, chosenColor, font })
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
    this.buttons = []
    this.buttonCount = 0
    this.initCanvas()
  }

  initCanvas () {
    const canvas = this.canvas
    const style = canvas.style
    style.width = '100vw'
    style.height = '100vh'
    style.left = style.top = 0
    style.position = 'fixed'
    style.zIndex = 9999

    document.body.appendChild(this.canvas)
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    canvas.onmousemove = (evt) => this.onmousemove(evt)
    canvas.oncontextmenu = (evt) => evt.preventDefault()
    this.hide()
  }

  resize () {
    this.canvas.style.display = 'block'
    this.canvas.width = this.canvas.offsetWidth * window.devicePixelRatio
    this.canvas.height = this.canvas.offsetHeight * window.devicePixelRatio
    this.hide()
  }

  ontouchmove (evt) {
    this.onmousemove(evt.touches[0])
  }

  onmousemove (evt) {
    const oldChosen = this.chosen
    const r = this.r

    const x = evt.clientX * window.devicePixelRatio - this.x
    const y = evt.clientY * window.devicePixelRatio - this.y

    const deltaX = x - r
    const deltaY = r - y
    const distanceSqr = deltaX ** 2 + deltaY ** 2
    if (distanceSqr < 30 ** 2 || distanceSqr > (r + 30) ** 2) {
      this.chosen = undefined
      if (oldChosen !== this.chosen) this.redraw()
      return
    }
    let theta = Math.atan2(deltaX, deltaY)
    if (this.buttonCount === 1) {
      if (Math.abs(theta / Math.PI) <= 0.5) this.chosen = 0
      else this.chosen = undefined
    } else {
      if (theta < 0) theta += 2 * Math.PI
      const step = (2 * Math.PI) / this.buttonCount
      this.chosen = Math.round(theta / step) % this.buttonCount
    }
    if (oldChosen !== this.chosen) this.redraw()
  }

  addButton (text, func) {
    this.buttons.push({ text, func })
    this.buttonCount++
    this.redrawNeeded = true
  }

  redraw () {
    const { canvas, ctx, r } = this

    let innerR = r / 2
    if (this.buttonCount === 1) innerR /= 1.5
    const step = (2 * Math.PI) / (this.buttonCount + 1)
    const space = step / this.buttonCount
    const maxWidth = Math.sqrt(
      2 * ((r + innerR) / 2) ** 2 * (1 - Math.cos(step))
    )

    // Clear canvas
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()

    const rotate = (rad) => {
      ctx.translate(r, r)
      ctx.rotate(rad)
      ctx.translate(-r, -r)
    }

    const drawButton = (i) => {
      // Draw whole circle
      ctx.beginPath()
      ctx.moveTo(r, r)
      ctx.arc(r, r, r, 0, step)
      ctx.lineTo(r, r)
      ctx.fill()
      ctx.stroke()

      // Remove inner circle
      ctx.save()
      ctx.lineWidth += 2
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.moveTo(r, r)
      ctx.arc(r, r, innerR, 0, step)
      ctx.lineTo(r, r)
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      // Stroke inner circle's arc
      ctx.beginPath()
      ctx.arc(r, r, innerR + ctx.lineWidth, 0, step)
      ctx.stroke()

      // Print button text
      ctx.save()
      rotate((Math.PI + step) / 2)
      ctx.fillStyle = i === this.chosen ? this.chosenColor : this.color
      ctx.fillText(this.buttons[i].text, r, (r - innerR) / 2, maxWidth)
      ctx.restore()
    }

    // Context defaults
    ctx.save()
    ctx.fillStyle = this.background
    ctx.lineWidth = 5
    ctx.textAlign = 'center'
    ctx.textBaseline = this.buttonCount > 2 ? 'middle' : 'top'
    ctx.font = this.font

    rotate(-(Math.PI + step) / 2)

    for (let i = 0; i < this.buttonCount; i++) {
      if (i !== this.chosen) drawButton(i)
      rotate(step + space)
    }

    // Draw the chosen one
    if (this.chosen !== undefined) {
      rotate(this.chosen * (step + space))
      ctx.fillStyle = this.chosenBackground
      ctx.translate(-20, -20)
      ctx.scale(1.05, 1.05)
      drawButton(this.chosen)
    }
    ctx.restore()
  }

  show (x, y) {
    this.x = x * window.devicePixelRatio - this.r
    this.y = y * window.devicePixelRatio - this.r
    this.ctx.setTransform(1, 0, 0, 1, this.x, this.y)
    this.redraw()
    this.redrawNeeded = false
    this.canvas.style.display = 'block'
  }

  hide () {
    this.canvas.style.display = 'none'
  }

  choose () {
    this.hide()
    if (this.chosen !== undefined) { this.buttons[this.chosen].func() }
    this.chosen = undefined
  }
}
