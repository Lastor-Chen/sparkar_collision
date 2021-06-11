import Reactive from 'Reactive'
import Diagnostics from 'Diagnostics'
import { tool } from './tool'

// 說明
// https://link.medium.com/sxBeXqKEZgb 

// 判斷左右側
// https://stackoverflow.com/questions/1560492/how-to-tell-whether-a-point-is-to-the-right-or-left-side-of-a-line

export async function runLeftRight(asset) {
  const user = asset.user as Plane
  const userBBox = tool.getBBox3d(user, { useRotation: true })

  const colliderMat = asset.colliderMat as DefaultMaterial
  colliderMat.opacity = Reactive.val(0.3)

  // 矩形
  const plane = asset.leftRight_plane as Plane
  const planeBBox = tool.getBBox3d(plane, { useRotation: true })

  Helper.checkHit3D(planeBBox, userBBox).monitor().subscribe(res => {
    const isHit = res.newValue
    colliderMat.opacity = isHit ? Reactive.val(1) : Reactive.val(0.3)
  })

  // 凸四邊形
  const trapezium = asset.leftRight_trapezium as Polygon
  await tool.setPolygon(trapezium)

  Helper.checkHit3D(trapezium, userBBox).monitor().subscribe(res => {
    const isHit = res.newValue
    colliderMat.opacity = isHit ? Reactive.val(1) : Reactive.val(0.3)
  })
}

class Helper {
  /** 碰撞偵測, 左右側法 */
  static checkHit3D(collider: BoundingBox3D | Polygon, role: BoundingBox3D | Polygon) {
    let roleInCollider: BoolSignal = null
    role.vertices.forEach((point) => {
      const isInShape = this.pointInShape(collider, point)
      roleInCollider = roleInCollider ? roleInCollider.or(isInShape) : isInShape
    })

    let colliderInRole: BoolSignal = null
    collider.vertices.forEach((point) => {
      const isInShape = this.pointInShape(role, point)
      colliderInRole = colliderInRole ? colliderInRole.or(isInShape) : isInShape
    })

    return roleInCollider.or(colliderInRole)
  }

  /** 檢查 point 是否位於 shape 內 */
  static pointInShape(shape: BoundingBox3D | Polygon, point: PointSignal) {
    const vertices = shape.vertices

    // 依序檢查 point 是否在 shape 各邊的內側
    let isInShape: BoolSignal = null
    for (let idx = 0; idx < vertices.length; idx++) {
      const nextPoint = vertices[idx + 1] || vertices[0]
      const isRightSide = this.calcWhichSide(vertices[idx], nextPoint, point).le(0)
      isInShape = isInShape ? isInShape.and(isRightSide) : isRightSide
    }

    return isInShape
  }

  /**
   * 判斷 pointC 在 lineAB 的哪一側, 外積法
   * - result > 0 在左側
   * - result < 0 在右側
   * - result === 0 在線上
   */
  static calcWhichSide(pointA: PointSignal, pointB: PointSignal, pointC: PointSignal) {
    // 向量矩陣求外積 vecAB X vecAC
    // cross = (xb - xa)*(yc - ya) - (yb - ya)*(xc - xa)
    const vectorAB = pointB.sub(pointA)
    const vectorAC = pointC.sub(pointA)

    // 外積求到的是法線向量, 由於計算用的兩向量在 xy 平面, 故法向量必為 (0, 0, z)
    // 取得 z 可得外積的純量
    return vectorAB.cross(vectorAC).z
  }

  /**
   * 判斷 point 在 lineAB 的哪一側, 直線方程式法
   * - point - target point3D
   * - linePointA - start point of a line
   * - linePointB - end point of a line
   */
  static calcWhichSideOld(pointA: PointSignal, pointB: PointSignal, point: PointSignal) {
    // 使用直線方程式 "一般式" => Ax + By + C = 0
    // 將目標 point 帶入求得值 D, 若 D === 0 在線上, D > 0 在右側, D < 0 在左側
    // 透過 "兩點式" 反推可得 A, B, C 帶入一般式得到此 line 的直線方程式
    // D = (y2 - y1)x + (x1 - x2)y + (x2 * y1 - x1 * y2)
    return point.x
      .mul(pointB.y.sub(pointA.y))
      .add(point.y.mul(pointA.x.sub(pointB.x)))
      .add(pointB.x.mul(pointA.y).sub(pointA.x.mul(pointB.y)))
  }
}
