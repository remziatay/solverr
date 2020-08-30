import React from 'react'
import { TouchHandler } from '../touchHandler'
import { PZPath } from '../Tools/PZPath'
import { PZcanvas } from '../PZcanvas'
import { CircleContextMenu } from '../CircleContextMenu'
import { PZImage } from '../Tools/PZImage'
import { PZLine } from '../Tools/PZLine'
import { PZRect } from '../Tools/PZRect'

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
      (_, __, evt) => this.menu.ontouchmove(evt),
      (evt) => {
        this.drawingPath?.cancel()
        this.drawingPath = null
        this.menu.show(evt.touches[0].clientX, evt.touches[0].clientY)
      },
      () => this.menu.choose()
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
      },
      strokeSize: 10,
      cursor: 'auto'

    }
  }

  startDragging ({ x, y, mobile = false } = {}) {
    switch (this.mode) {
      case 'pan':
        if (!mobile) this.setState({ cursor: 'grabbing' })
        break
      case 'edit':
        this.drawingPath = new PZPath(this.pz, this.props.connection, this.state.strokeSize)
        break
      case 'line':
        this.drawingPath = new PZLine(this.pz, this.props.connection, this.state.strokeSize).startPoint(x, y)
        break
      case 'rect':
        this.drawingPath = new PZRect(this.pz, this.props.connection, this.state.strokeSize).startPoint(x, y)
        break
      default:
        break
    }
  }

  keepDragging (x1, y1, x2, y2) {
    switch (this.mode) {
      case 'pan':
        this.pz.pan(x1 - x2, y1 - y2)
        break
      case 'edit':
        this.drawingPath.add(x1, y1, x2, y2)
        break
      case 'line':
      case 'rect':
        this.drawingPath.movePoint(x2, y2).update()
        break
      default:
        break
    }
  }

  endDragging (mobile = false) {
    switch (this.mode) {
      case 'pan':
        if (!mobile) this.setState({ cursor: 'grab' })
        break
      case 'edit':
      case 'line':
      case 'rect':
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
    } else if (evt.buttons === 3 && this.mode === 'edit') {
      // left and right click at the same time to cancel dragging
      this.dragStart = false
      this.dragging = false
      this.drawingPath?.cancel()
      this.drawingPath = null
    } else if (evt.buttons === 2) {
      this.menu.show(evt.clientX, evt.clientY)
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
      if (this.mode === 'pan') this.setState({ cursor: 'grab' })
    } else this.endDragging()
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
      if (this.mode === 'pan') this.changeStrokeSize(0)
      this.mode = 'edit'
    })

    this.menu.addButton('Line', () => {
      if (this.mode === 'pan') this.changeStrokeSize(0)
      this.mode = 'line'
    })

    this.menu.addButton('Rect', () => {
      if (this.mode === 'pan') this.changeStrokeSize(0)
      this.mode = 'rect'
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
    switch (data.type) {
      case 'image':
        new PZImage(this.pz, this.props.connection, true).from(data)
        break
      case 'clear':
        this.pz.clear()
        break
      case 'path':
        new PZPath(this.pz, this.props.connection).from(data).finish()
        break
      case 'line':
        new PZLine(this.pz, this.props.connection).from(data).finish()
        break
      case 'rect':
        new PZRect(this.pz, this.props.connection).from(data).finish()
        break
      default:
        break
    }
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
