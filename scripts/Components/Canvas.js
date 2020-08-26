import React from 'react'
import { TouchHandler } from '../touchHandler'
import { PZPath } from '../PZPath'
import { PZcanvas } from '../PZcanvas'
import { CircleContextMenu } from '../CircleContextMenu'
import { PZImage } from '../PZImage'

export default class Canvas extends React.Component {
  dragStart = false
  dragging = false
  mode = 'edit'
  menu = new CircleContextMenu(200)
  touchHandler = new TouchHandler(500, 3)
  canvasRef = React.createRef()

  constructor (props) {
    super(props)
    this.touchHandler.addGestureListener('drag',
      (touch, lastTouch, evt) => {
        const x = touch.clientX
        const y = touch.clientY
        switch (this.mode) {
          case 'edit': {
            if (!this.drawingPath) break
            const rect = evt.target.getBoundingClientRect()
            this.drawingPath.add(lastTouch.clientX - rect.left, lastTouch.clientY - rect.top, x - rect.left, y - rect.top)
            break
          }
          case 'pan':
            this.pz.pan(lastTouch.clientX - x, lastTouch.clientY - y)
            break
          default:
            break
        }
      },
      () => {
        if (this.mode === 'edit') this.drawingPath = new PZPath(this.pz, this.props.connection, this.state.strokeSize)
      },
      () => { if (this.mode === 'edit') this.drawingPath?.finish() }
    )

    this.touchHandler.addGestureListener('longTouchDrag',
      (_, __, evt) => this.menu.ontouchmove(evt),
      (evt) => this.menu.show(evt.touches[0].clientX, evt.touches[0].clientY),
      () => this.menu.choose()
    )

    this.touchHandler.addGestureListener('twoFingerZoom',
      (zoom, center) => this.pz.zoom(1 + zoom * 0.005, center.x, center.y),
      () => {
        if (this.mode === 'edit') {
          this.drawingPath.cancel()
          this.drawingPath = null
        }
      }
    )

    this.touchHandler.addGestureListener('twoFingerDrag',
      (panX, panY) => this.pz.pan(panX, panY)
    )

    this.state = {
      listeners: {
        onMouseDown: this.onMouseDown,
        onMouseMove: this.onMouseMove,
        onMouseUp: this.onMouseUp,
        onTouchStart: this.touchHandler.onTouchStart,
        onTouchMove: this.touchHandler.onTouchMove,
        onTouchEnd: this.touchHandler.onTouchEnd,
        onWheel: this.handleScroll
      },
      strokeSize: 10,
      cursor: 'auto'

    }
  }

  onMouseDown = evt => {
    this.lastXY = { x: evt.nativeEvent.offsetX, y: evt.nativeEvent.offsetY }
    evt.preventDefault()
    if (evt.buttons === 1) {
      this.dragStart = true
      this.dragging = false
      if (this.mode === 'edit') this.drawingPath = new PZPath(this.pz, this.props.connection, this.state.strokeSize)
      else if (this.mode === 'pan') this.setState({ cursor: 'grabbing' })
    } else if (evt.buttons === 3 && this.mode === 'edit') {
      // left and right click at the same time to cancel dragging
      this.dragStart = false
      this.dragging = false
      this.drawingPath.cancel()
    } else if (evt.buttons === 2) {
      this.menu.show(evt.clientX, evt.clientY)
    }
  }

  onMouseMove = evt => {
    if (!this.dragStart) return
    this.dragging = true
    const x = evt.nativeEvent.offsetX
    const y = evt.nativeEvent.offsetY
    switch (this.mode) {
      case 'edit':
        this.drawingPath.add(this.lastXY.x, this.lastXY.y, x, y)
        break
      case 'pan':
        this.pz.pan(this.lastXY.x - x, this.lastXY.y - y)
        break
      default:
        break
    }
    this.lastXY = { x, y }
  }

  onMouseUp = evt => {
    if (!this.dragStart || evt.button !== 0) return
    if (this.mode === 'pan') this.setState({ cursor: 'grab' })
    this.dragStart = false
    if (!this.dragging) {
      const zoom = evt.shiftKey ? 0.9 : 1.1
      this.pz.zoom(zoom, evt.nativeEvent.offsetX, evt.nativeEvent.offsetY)
    } else if (this.mode === 'edit') {
      this.drawingPath.finish()
    }
    this.dragging = false
  }

  handleScroll = evt => {
    evt = evt.nativeEvent
    if (this.dragStart) return
    const delta = evt.wheelDelta ? -evt.wheelDelta / 120 : evt.deltaY / 3

    if (evt.ctrlKey && this.mode === 'edit') {
      this.changeStrokeSize(evt.deltaY < 0 ? 2 : -2)
      return
    }
    this.pz.zoom(1 - delta / 10, evt.offsetX, evt.offsetY)
  }

  changeStrokeSize = change => {
    this.setState(state => {
      const strokeSize = Math.min(Math.max(state.strokeSize + change, 1), 128)
      if (change && strokeSize === state.strokeSize) return
      const changes = { strokeSize }
      if (strokeSize < 5) changes.cursor = 'crosshair'
      const svg = `<svg width="${strokeSize}" height="${strokeSize}" xmlns="http://www.w3.org/2000/svg"><circle r="${strokeSize / 2 - 1}" cy="${strokeSize / 2}" cx="${strokeSize / 2}" stroke-width="1.5" stroke="black" fill="none"/></svg>`
      changes.cursor = `url('data:image/svg+xml;utf8,${svg}') ${strokeSize / 2} ${strokeSize / 2}, auto`
      return changes
    })
  }

  componentDidUpdate () {
    // For immediate cursor update on FF
    this.canvasRef.current.focus()
  }

  resize = () => {
    this.menu.resize()
    const canvas = this.canvasRef.current
    const { width, height } = canvas.style
    canvas.style.width = canvas.style.height = ''
    const { offsetWidth, offsetHeight } = canvas
    Object.assign(canvas.style, { width, height })
    this.setState({
      styleWidth: Math.round(offsetWidth * window.devicePixelRatio) / window.devicePixelRatio + 'px',
      styleHeight: Math.round(offsetHeight * window.devicePixelRatio) / window.devicePixelRatio + 'px',
      width: Math.round(offsetWidth * window.devicePixelRatio),
      height: Math.round(offsetHeight * window.devicePixelRatio)
    }, () => this.pz.resize())
  }

  componentDidMount () {
    const canvas = this.canvasRef.current
    this.resize()
    this.pz = new PZcanvas(canvas, 6400, 6400)
    if (this.mode === 'edit') this.changeStrokeSize(0)
    else if (this.mode === 'pan') this.setState({ cursor: 'grab' })
    // React can't prevent these for some reason. That's why preventing in native listeners
    this.preventDef = evt => evt.preventDefault()
    canvas.addEventListener('wheel', this.preventDef)
    canvas.addEventListener('contextmenu', this.preventDef)
    canvas.addEventListener('touchstart', this.preventDef)

    window.addEventListener('resize', this.resize)
    matchMedia('(resolution: 0dppx)').addListener(this.resize)

    this.props.setPZ(this.pz)

    this.menu.canvas.onmouseup = () => this.menu.choose()
    this.menu.addButton('Pan', () => {
      this.mode = 'pan'
      this.setState({ cursor: 'grab' })
    })

    this.menu.addButton('Draw', () => {
      this.mode = 'edit'
      this.changeStrokeSize(0)
    })

    this.props.connection.on('data', this.ondata)
  }

  componentWillUnmount () {
    const canvas = this.canvasRef.current
    canvas.removeEventListener('wheel', this.preventDef)
    canvas.removeEventListener('contextmenu', this.preventDef)
    canvas.removeEventListener('touchstart', this.preventDef)
  }

  ondata = data => {
    if (data.type === 'path') new PZPath(this.pz, this.props.connection).from(data).finish()
    else if (data.type === 'image') new PZImage(this.pz, this.props.connection, true).from(data)
    else if (data.type === 'clear') this.pz.clear()
  }

  render () {
    const style = {
      cursor: this.state.cursor,
      width: this.state.styleWidth,
      height: this.state.styleHeight
    }

    if (this.props.image?.setCursor()) this.props.image.setCursor = cursor => cursor && this.setState({ cursor })
    const listeners = { ...this.state.listeners, ...this.props.image?.getNewListeners() }

    return (
      <canvas
        {...listeners}
        ref={this.canvasRef}
        id='main-canvas'
        width={this.state.width}
        height={this.state.height}
        style={style}
        className="shadow border border-dark"/>
    )
  }
}
