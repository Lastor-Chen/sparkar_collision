import Reactive from 'Reactive'
import Diagnostics from 'Diagnostics'

const utils = {
  /**
   * 對 3D 物件生成 z 恆為 0 的虛擬 Bounding Box
   * ```
   * config {
   *   parent?: SceneObjectBase - 父層無旋轉為前提
   *   useRotation?: boolean - default false
   * }
   * ```
   */
  getBBox3d(obj: Plane, config?: getBBox3dConfig): BoundingBox3D {
    const parent = config && config.parent
    const useRotation = config && config.useRotation

    // 計算中心
    const pivot = parent ?
      obj.transform.position.mul(parent.transform.scale).add(parent.transform.position) :
      obj.transform.position

    // 計算真實 size 寬高 (width, height 為單位寬高)
    const sizeX = parent ?
      obj.width.mul(obj.transform.scaleX).mul(parent.transform.scaleX) :
      obj.width.mul(obj.transform.scaleX)
    const sizeY = parent ?
      obj.height.mul(obj.transform.scaleY).mul(parent.transform.scaleY) :
      obj.height.mul(obj.transform.scaleY)

    // 計算 4 個角之點位
    const corners = [
      // 順時針, 左下開始
      Reactive.point(sizeX.div(2).neg(), sizeY.div(2).neg(), 0),
      Reactive.point(sizeX.div(2).neg(), sizeY.div(2), 0),
      Reactive.point(sizeX.div(2), sizeY.div(2), 0),
      Reactive.point(sizeX.div(2), sizeY.div(2).neg(), 0),
    ]

    const rotationZ = obj.transform.rotationZ
    const vertices = corners.map(refPoint => {
      const corner = pivot.add(refPoint)
      return useRotation ? this.rotatePointInXY(corner, pivot, rotationZ) : corner
    })

    return {
      pivot: Reactive.point(pivot.x, pivot.y, 0),
      vertices: vertices,
      left: vertices[0].x,
      top: vertices[1].y,
      right: vertices[2].x,
      bottom: vertices[3].y,
      sizeX: sizeX,
      sizeY: sizeY,
    }
  },

  /** 在 xy 平面上, 以 pivot 為中心旋轉 point */
  rotatePointInXY(point: PointSignal, pivot: PointSignal, radians: ScalarSignal) {
    const { x, y } = point
    const { x: x0, y: y0 } = pivot
    const cos = Reactive.cos(radians)
    const sin = Reactive.sin(radians)

    // 需先推回原點, 旋轉後再移回原位
    // x' = x * cos(θ) - y * sin(θ)
    // y' = x * sin(θ) + y * cos(θ)
    return Reactive.point(
      x.sub(x0).mul(cos).sub(y.sub(y0).mul(sin)).add(x0),
      x.sub(x0).mul(sin).add(y.sub(y0).mul(cos)).add(y0),
      0
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

  /** 給 poly 添加 vertices 與 pivot 屬性 */
  async setPolygon(polygon: Polygon) {
    const polyTransform = polygon.transform
    const vertices = await polygon.findByPath('*/vertex*')

    // 計算 mesh 父層 position, scale
    polygon.vertices = vertices.map(vertex => {
      const point = vertex.transform.position
      return point.mul(polyTransform.scale).add(polyTransform.position)
    })
    polygon.pivot = polyTransform.position
  },
}

// Object method  overloading
type Tool = typeof utils
interface ToolModule extends Tool {
  toRadians(degrees: number): number;
  toRadians(degrees: ScalarSignal): ScalarSignal;
  toDegrees(degrees: number): number;
  toDegrees(degrees: ScalarSignal): ScalarSignal;
}

export const tool = utils as ToolModule

/** 其他未使用到的向量幾何函式 */
export const other = {
  /**
   * 線是否相交於圓, 外積
   * - source - https://mathworld.wolfram.com/Circle-LineIntersection.html
   */
  intersectLineCircle(pointA: PointSignal, pointB: PointSignal, circle: BoundingBox3D) {
    const radius = circle.sizeX.div(2)
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
    const radius = circle.sizeX.div(2)
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
