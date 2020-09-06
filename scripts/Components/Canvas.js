import React from 'react'
import { TouchHandler } from '../touchHandler'
import { PZcanvas } from '../PZcanvas'
import { PZImage } from '../Tools/PZImage'

export default class Canvas extends React.Component {
  dragStart = false
  dragging = false
  touchHandler = new TouchHandler(500, 5)
  canvasRef = React.createRef()

  constructor (props) {
    super(props)
    this.touchHandler.addGestureListener('drag',
      (touch, lastTouch, evt) => {
        const rect = evt.target.getBoundingClientRect()
        this.keepDragging(lastTouch.clientX - rect.left, lastTouch.clientY - rect.top,
          touch.clientX - rect.left, touch.clientY - rect.top)
      },
      (touch, evt) => {
        const rect = evt.target.getBoundingClientRect()
        this.startDragging({ x: touch.clientX - rect.left, y: touch.clientY - rect.top, mobile: true })
      },
      () => this.endDragging(true)
    )

    this.touchHandler.addGestureListener('longTouchDrag',
      (_, __, evt) => this.props.menu.ontouchmove(evt),
      (touch) => {
        this.drawingPath?.cancel()
        this.drawingPath = null
        this.props.menu.show(touch.clientX, touch.clientY)
      },
      () => this.props.menu.choose()
    )

    this.touchHandler.addGestureListener('twoFingerZoom',
      (zoom, center) => this.pz.zoom(1 + zoom * 0.005, center.x, center.y),
      () => {
        this.drawingPath?.cancel()
        this.drawingPath = null
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
      }
    }
  }

  startDragging ({ x, y, mobile = false } = {}) {
    switch (this.props.mode) {
      case 'pan':
        if (!mobile) this.props.setCursor('grabbing')
        break
      case 'tool':
        this.drawingPath = new this.props.Tool(this.pz, this.props.connection, this.props.strokeSize).startPoint(x, y)
        break
      default:
        break
    }
  }

  keepDragging (x1, y1, x2, y2) {
    switch (this.props.mode) {
      case 'pan':
        this.pz.pan(x1 - x2, y1 - y2)
        break
      case 'tool':
        this.drawingPath.movePoint(x2, y2).update()
        break
      default:
        break
    }
  }

  endDragging (mobile = false) {
    switch (this.props.mode) {
      case 'pan':
        if (!mobile) this.props.setCursor('grab')
        break
      case 'tool':
        this.drawingPath?.finish()
        break
      default:
        break
    }
  }

  onMouseDown = evt => {
    this.lastXY = { x: evt.nativeEvent.offsetX, y: evt.nativeEvent.offsetY }
    evt.preventDefault()
    if (evt.buttons === 1) {
      this.dragStart = true
      this.dragging = false
      this.startDragging(this.lastXY)
    } else if (evt.buttons === 3 && this.props.mode === 'tool') {
      // left and right click at the same time to cancel dragging
      this.dragStart = false
      this.dragging = false
      this.drawingPath?.cancel()
      this.drawingPath = null
    } else if (evt.buttons === 2) {
      this.props.menu.show(evt.clientX, evt.clientY)
    }
  }

  onMouseMove = evt => {
    if (!this.dragStart) return
    this.dragging = true
    const x = evt.nativeEvent.offsetX
    const y = evt.nativeEvent.offsetY
    this.keepDragging(this.lastXY.x, this.lastXY.y, x, y)
    this.lastXY = { x, y }
  }

  onMouseUp = evt => {
    if (!this.dragStart || evt.button !== 0) return
    this.dragStart = false
    if (!this.dragging) {
      const zoom = evt.shiftKey ? 0.9 : 1.1
      this.pz.zoom(zoom, evt.nativeEvent.offsetX, evt.nativeEvent.offsetY)
      if (this.props.mode === 'pan') this.props.setCursor('grab')
    } else this.endDragging()
    this.dragging = false
  }

  handleScroll = evt => {
    evt = evt.nativeEvent
    if (this.dragStart) return
    const delta = evt.wheelDelta ? -evt.wheelDelta / 120 : evt.deltaY / 3

    if (evt.ctrlKey && this.props.mode === 'tool') {
      this.props.changeStrokeSize(evt.deltaY < 0 ? 2 : -2)
      return
    }
    this.pz.zoom(1 - delta / 10, evt.offsetX, evt.offsetY)
  }

  componentDidUpdate () {
    // For immediate cursor update on FF
    this.canvasRef.current.focus()
  }

  resize = () => {
    this.props.menu.resize()
    const canvas = this.canvasRef.current
    const { marginRight, marginBottom } = canvas.style
    canvas.style.marginRight = canvas.style.marginBottom = ''
    const rect = canvas.getBoundingClientRect()
    Object.assign(canvas.style, { marginRight, marginBottom })
    const width = Math.round(rect.width * window.devicePixelRatio)
    const height = Math.round(rect.height * window.devicePixelRatio)
    this.setState({
      marginX: rect.width - width / window.devicePixelRatio,
      marginY: rect.height - height / window.devicePixelRatio,
      width,
      height
    }, () => this.pz.resize())
  }

  componentDidMount () {
    const canvas = this.canvasRef.current
    this.resize()
    this.pz = new PZcanvas(canvas, 4800, 3600)

    // React can't prevent these for some reason. That's why preventing in native listeners
    this.preventDef = evt => evt.preventDefault()
    this.capturePointer = evt => { if (evt.buttons === 1) evt.target.setPointerCapture(evt.pointerId) }
    this.releasePointer = evt => evt.target.releasePointerCapture(evt.pointerId)
    canvas.addEventListener('wheel', this.preventDef)
    canvas.addEventListener('contextmenu', this.preventDef)
    canvas.addEventListener('touchstart', this.preventDef)
    canvas.addEventListener('pointerdown', this.capturePointer)
    canvas.addEventListener('pointerup', this.releasePointer)

    window.addEventListener('resize', this.resize)
    matchMedia('(resolution: 0dppx)').addListener(this.resize)

    this.props.setPZ(this.pz)

    this.oldConnection = this.props.connection
    this.props.connection.on('data', this.ondata)
  }

  componentWillUnmount () {
    const canvas = this.canvasRef.current
    canvas.removeEventListener('wheel', this.preventDef)
    canvas.removeEventListener('contextmenu', this.preventDef)
    canvas.removeEventListener('touchstart', this.preventDef)
    canvas.removeEventListener('pointerdown', this.capturePointer)
    canvas.removeEventListener('pointerup', this.releasePointer)
  }

  ondata = data => {
    switch (data.type) {
      case 'image':
        new PZImage(this.pz, this.props.connection, true).from(data)
        break
      case 'clear':
        this.pz.clear()
        break
      default: {
        const Tool = this.props.constructors[data.type]
        if (Tool) new Tool(this.pz, this.props.connection).from(data).finish()
      }
    }
  }

  render () {
    if (this.oldConnection !== this.props.connection) {
      this.oldConnection = this.props.connection
      this.props.connection.on('data', this.ondata)
    }
    const style = {
      cursor: this.props.cursor,
      marginRight: this.state.marginX,
      marginBottom: this.state.marginY
    }

    if (this.props.image?.setCursor()) this.props.image.setCursor = cursor => cursor && this.props.setCursor(cursor)
    const listeners = { ...this.state.listeners, ...this.props.image?.getNewListeners() }

    return (
      <canvas
        {...listeners}
        ref={this.canvasRef}
        id='main-canvas'
        width={this.state.width}
        height={this.state.height}
        style={style}/>
    )
  }
}
