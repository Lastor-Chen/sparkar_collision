import Reactive from 'Reactive'
import Diagnostics from 'Diagnostics'
import { tool } from './tool'

/** 不實用, 需要特規去寫, 封口得另外處理 */
export async function runMultiLines(asset) {
  const user = asset.user as Plane
  const userBBox = tool.getBBox3d(user, { useRotation: true })

  const colliderMat = asset.colliderMat as DefaultMaterial
  colliderMat.opacity = Reactive.val(0.3)

  // 設定 mesh
  const uMesh = asset.multiLines_u_mesh as Polygon
  await tool.setPolygon(uMesh)

  // 分出外圈與內圈的點雲
  const vertices = uMesh.vertices
  const outside = vertices.slice(0, vertices.length / 2)
  const inside = vertices.slice(vertices.length / 2)

  // 偵測 user 是否跑出軌道
  const isOutsideIn = Helper.checkRectInLines(outside, userBBox)
  const isInsideOut = Helper.checkRectOutLines(inside, userBBox)
  isOutsideIn.and(isInsideOut).monitor().subscribe(res => {
    const isHit = res.newValue
    colliderMat.opacity = isHit ? Reactive.val(1) : Reactive.val(0.3)
  })
}

class Helper {
  /** 檢查 rect 是否在外圈內部 */
  static checkRectInLines(outside: PointSignal[], role: BoundingBox3D) {
    // 依序檢查外圈每一條 edge
    let isInside: BoolSignal = null
    outside.forEach((_, idx) => {
      if (!outside[idx + 1]) return void 0
      const pointA = outside[idx]
      const pointB = outside[idx + 1]

      // 檢查 role 各點是否在 lineAB 內側
      let isInLine: BoolSignal = null
      for (const point of role.vertices) {
        const isRightSide = this.calcWhichSide(pointA, pointB, point).le(0)
        isInLine = isInLine ? isInLine.and(isRightSide) : isRightSide
      }

      isInside = isInside ? isInside.and(isInLine) : isInLine
    })

    return isInside
  }

  /** 檢查 rect 是否在內圈外部 */
  static checkRectOutLines(inside: PointSignal[], role: BoundingBox3D) {
    // 依序檢查內圈每一條 edge
    let isOutside: BoolSignal = null
    inside.forEach((_, index) => {
      if (!inside[index + 1]) return void 0
      const pointA = inside[index]
      const pointB = inside[index + 1]

      // 檢查 role 各點是否在 lineAB 外側
      let isOutLine: BoolSignal = null
      for (const point of role.vertices) {
        const isLeftSide = this.calcWhichSide(pointA, pointB, point).gt(0)
        isOutLine = isOutLine ? isOutLine.and(isLeftSide) : isLeftSide
      }
      isOutside = isOutside ? isOutside.or(isOutLine) : isOutLine
    })

    return isOutside
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
}
