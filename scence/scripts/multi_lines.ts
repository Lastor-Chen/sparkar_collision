import Diagnostics from 'Diagnostics'
import { tool } from './tool'

// 連續線段判定, 左右側
export function runMultiLines(asset) {
  const user = asset.user as Plane
  const userBBox = tool.genBoundingBox3D(user)

  const vertices = asset.vertices as SceneObject[]
  const outside = vertices.slice(0, vertices.length / 2)
  const inside = vertices.slice(vertices.length / 2)
  Diagnostics.watch('in', checkHitBySide(outside, inside, userBBox))
}

/** 連續線段, 左右側法, 不含封口 */
function checkHitBySide(outside: SceneObject[], inside: SceneObject[], roleBBox: BoundingBox3D) {
  let isOutsideIn: BoolSignal = null
  outside.forEach((_, index) => {
    if (!outside[index + 1]) return void 0
    const pointA = outside[index].transform.position
    const pointB = outside[index + 1].transform.position

    const lt_line = tool.calcWhichSide2(pointA, pointB, roleBBox.pointLT)
    const lb_line = tool.calcWhichSide2(pointA, pointB, roleBBox.pointLB)
    const rt_line = tool.calcWhichSide2(pointA, pointB, roleBBox.pointRT)
    const rb_line = tool.calcWhichSide2(pointA, pointB, roleBBox.pointRB)
    const role_line = lt_line.le(0).and(lb_line.le(0)).and(rt_line.le(0)).and(rb_line.le(0))
    isOutsideIn = isOutsideIn ? isOutsideIn.and(role_line) : role_line
  })

  // 與外側相異, 邏輯反轉
  let isInsideIn: BoolSignal = null
  inside.forEach((_, index) => {
    if (!inside[index + 1]) return void 0
    const pointA = inside[index].transform.position
    const pointB = inside[index + 1].transform.position

    const lt_line = tool.calcWhichSide2(pointA, pointB, roleBBox.pointLT)
    const lb_line = tool.calcWhichSide2(pointA, pointB, roleBBox.pointLB)
    const rt_line = tool.calcWhichSide2(pointA, pointB, roleBBox.pointRT)
    const rb_line = tool.calcWhichSide2(pointA, pointB, roleBBox.pointRB)
    const role_line = lt_line.gt(0).and(lb_line.gt(0)).and(rt_line.gt(0)).and(rb_line.gt(0))
    isInsideIn = isInsideIn ? isInsideIn.or(role_line) : role_line
  })

  return isOutsideIn.and(isInsideIn)
}