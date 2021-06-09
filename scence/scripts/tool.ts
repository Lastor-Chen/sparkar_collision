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

/** 其他未使用到的向量幾何函式 */
export const other = {
  /**
   * 點是否在矩形內(旋轉可), 內積法
   * - source - https://math.stackexchange.com/questions/190111/how-to-check-if-a-point-is-inside-a-rectangle
   */
  pointInRectByDot(point: PointSignal, rectBBox: BoundingBox3D) {
    // rect(A,B,C,D) 點位順時針 vs point(P)
    // 公式: (0 ≤ AP·AB ≤ AB·AB) and (0 ≤ AP·AD ≤ AD·AD)
    const pointA = rectBBox.pointLT
    const pointB = rectBBox.pointRT
    const pointD = rectBBox.pointLB
    const vecAB = pointB.sub(pointA)
    const vecAD = pointD.sub(pointA)
    const vecAP = point.sub(pointA)

    // 0 ≤ AP·AB && AP·AB ≤ AB·AB
    const leftIn = vecAP.dot(vecAB).ge(0).and(vecAP.dot(vecAB).le(vecAB.dot(vecAB)))
    // 0 ≤ AP·AD && AP·AD ≤ AD·AD
    const rightIn = vecAP.dot(vecAD).ge(0).and(vecAP.dot(vecAD).le(vecAD.dot(vecAD)))
    return leftIn.and(rightIn)
  },

  /** 點是否在矩形內(無旋轉), 傳統法 */
  pointInRect(point: PointSignal, rectBBox: BoundingBox3D) {
    // rectLeft <= pointX <= rectRight
    const xIn = rectBBox.left.le(point.x).and(point.x.le(rectBBox.right))
    // rectBottom <= pointY <= rectTop
    const yIn = rectBBox.bottom.le(point.y).and(point.y.le(rectBBox.top))

    return xIn.and(yIn)
  },

  /**
   * 線是否相交於圓, 外積
   * - source - https://mathworld.wolfram.com/Circle-LineIntersection.html
   */
  intersectLineCircle(pointA: PointSignal, pointB: PointSignal, circle: BoundingBox3D) {
    const radius = circle.halfSizeX
    // 兩點距離的平方
    const squaredDistance = pointB.sub(pointA).magnitudeSquared()
    // 外積, cross product
    const cross = pointA.cross(pointB).magnitude()

    // res = 0 相切, res > 0 相交
    return radius.pow(2).mul(squaredDistance).sub(cross.pow(2)).ge(0)
  },

  /**
   * 線是否相交於圓, 內積 + 畢式定理
   * - source - https://gamedev.net/forums/topic/309663-2d-vector-intersection-with-circle-or-box/309663/
   */
  intersectVectorCircle(pointA: PointSignal, pointB: PointSignal, circle: BoundingBox3D) {
    const radius = circle.halfSizeX
    // pointC is circle center
    const vecAC = circle.pivot.sub(pointA)
    const vecAB = pointB.sub(pointA)
    // vecCA 到 vecAB 的正射影長
    const projectLength = vecAC.dot(vecAB).div(vecAB.magnitude())
    // 畢式定理, pointC 到 vecAB 的距離平方
    const distanceSquared = vecAC.dot(vecAC).sub(projectLength.pow(2))
    return distanceSquared.le(radius.pow(2))
  },

  /** 點到線之距離, pointC to lineAB */
  distancePointToLine(pointA: PointSignal, pointB: PointSignal, pointC: PointSignal) {
    // 3維: https://onlinemschool.com/math/library/analytic_geometry/p_line/
    const vecAP = pointC.sub(pointA)
    const vecAB = pointB.sub(pointA)
    return vecAP.cross(vecAB).magnitude().div(vecAB.magnitude())

    // 2維: https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
    // (x2 - x1)(y1 - y) - (x1 - x)(y2 - y1) / √(x2 - x1)^2 + (y2 - y1)^2
    // return pointB.x.sub(pointA.x).mul(pointA.y.sub(pointC.y)).sub(pointA.x.sub(pointC.x).mul(pointB.y.sub(pointA.y)))
    //         .div(pointB.sub(pointA).magnitude())
  },
}