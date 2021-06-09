import Reactive from 'Reactive'

export const tool = {
  /**
   * 對 3D 物件生成 z 恆為 0 的 Bounding Box, 含旋轉
   * - parent?: 計算父層 transform
   */
  getBBox3D(obj: Plane, parent?: SceneObjectBase): BoundingBox3D {
    const posX = parent ?
      parent.transform.x.add(obj.transform.x.mul(parent.transform.scale.x)) :
      obj.transform.x
    const posY = parent ?
      parent.transform.y.add(obj.transform.y.mul(parent.transform.scale.y)) :
      obj.transform.y

    // Get the half size
    const halfSizeX: ScalarSignal = parent ?
      obj.width.mul(obj.transform.scale.x).mul(parent.transform.scale.x).div(2) :
      obj.width.mul(obj.transform.scale.x).div(2)
    const halfSizeY: ScalarSignal = parent ?
      obj.height.mul(obj.transform.scale.y).mul(parent.transform.scale.y).div(2) :
      obj.height.mul(obj.transform.scale.y).div(2)

    // Get origin point in the plane
    const originPointLT = Reactive.point2d(posX.sub(halfSizeX), posY.add(halfSizeY))
    const originPointRT = Reactive.point2d(posX.add(halfSizeX), posY.add(halfSizeY))
    const originPointRB = Reactive.point2d(posX.add(halfSizeX), posY.sub(halfSizeY))
    const originPointLB = Reactive.point2d(posX.sub(halfSizeX), posY.sub(halfSizeY))
    const pivot = Reactive.point2d(posX, posY)
    const rotationZ = obj.transform.rotationZ

    // Rotate the plane, then change to point3D
    const pointLT = Reactive.pack2(tool.rotatePoint2D(originPointLT, pivot, rotationZ), 0)
    const pointLB = Reactive.pack2(tool.rotatePoint2D(originPointLB, pivot, rotationZ), 0)
    const pointRT = Reactive.pack2(tool.rotatePoint2D(originPointRT, pivot, rotationZ), 0)
    const pointRB = Reactive.pack2(tool.rotatePoint2D(originPointRB, pivot, rotationZ), 0)

    return {
      pivot: Reactive.point(posX, posY, 0),
      pointLT: pointLT,
      pointRT: pointRT,
      pointRB: pointRB,
      pointLB: pointLB,
      vertices: [pointLB, pointLT, pointRT, pointRB],
      left: posX.sub(halfSizeX),
      top: posY.add(halfSizeY),
      right: posX.add(halfSizeX),
      bottom: posY.sub(halfSizeY),
      halfSizeX: halfSizeX,
      halfSizeY: halfSizeY,
    }
  },

  /** Rotate a point2D around center(0,0) */
  rotatePoint2D(point2D: Point2DSignal, pivot: Point2DSignal, radians: ScalarSignal) {
    const { x, y } = point2D
    const { x: x0, y: y0 } = pivot
    const cos = Reactive.cos(radians)
    const sin = Reactive.sin(radians)

    // x' = x * cos(θ) - y * sin(θ)
    // y' = x * sin(θ) + y * cos(θ)
    // 先推回原點, 旋轉後再移回原位
    return Reactive.point2d(
      x.sub(x0).mul(cos).sub(y.sub(y0).mul(sin)).add(x0),
      x.sub(x0).mul(sin).add(y.sub(y0).mul(cos)).add(y0)
    )
  },

  /** Convert degrees to radians. */
  toRadians(degrees: number | ScalarSignal) {
    if (typeof degrees === 'number') {
      return degrees * (Math.PI / 180)
    } else {
      return degrees.mul(Math.PI / 180)
    }
  },

  /** Convert radians to degrees. */
  toDegrees(radians: number | ScalarSignal) {
    if (typeof radians === 'number') {
      return 180 * (radians / Math.PI)
    } else {
      return radians.div(Math.PI).mul(180)
    }
  },
}