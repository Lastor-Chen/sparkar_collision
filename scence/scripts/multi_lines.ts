import Reactive from 'Reactive'
import Diagnostics from 'Diagnostics'
import { tool } from './tool'

/**
 * 不實用, 需要特規去寫, 封口得另外處理
 */
export function runMultiLines(asset) {
  const user = asset.user as Plane
  const userBBox = tool.getBBox3D(user)

  const colliderMat = asset.colliderMat as DefaultMaterial
  colliderMat.opacity = Reactive.val(0.3)

  const vertices = asset.multiLines_vertices as SceneObject[]
  const outside = vertices.slice(0, vertices.length / 2)
  const inside = vertices.slice(vertices.length / 2)

  const isOutsideIn = checkRectInLines(outside, userBBox)
  const isInsideOut = checkRectOutLines(inside, userBBox)

  isOutsideIn.and(isInsideOut).monitor().subscribe(res => {
    const isHit = res.newValue
    colliderMat.opacity = isHit ? Reactive.val(1) : Reactive.val(0.3)
  })
}

/** 檢查 rect 是否在外圈內部 */
function checkRectInLines(outside: SceneObject[], role: BoundingBox3D) {
  let isInside: BoolSignal = null
  outside.forEach((_, index) => {
    if (!outside[index + 1]) return void 0
    const pointA = outside[index].transform.position
    const pointB = outside[index + 1].transform.position

    const lt_line = calcWhichSide(pointA, pointB, role.vertices[0])
    const lb_line = calcWhichSide(pointA, pointB, role.vertices[1])
    const rt_line = calcWhichSide(pointA, pointB, role.vertices[2])
    const rb_line = calcWhichSide(pointA, pointB, role.vertices[3])
    const role_line = lt_line.le(0).and(lb_line.le(0)).and(rt_line.le(0)).and(rb_line.le(0))
    isInside = isInside ? isInside.and(role_line) : role_line
  })

  return isInside
}

/** 檢查 rect 是否在內圈外部 */
function checkRectOutLines(inside: SceneObject[], role: BoundingBox3D) {
  let isOutside: BoolSignal = null
  inside.forEach((_, index) => {
    if (!inside[index + 1]) return void 0
    const pointA = inside[index].transform.position
    const pointB = inside[index + 1].transform.position

    const lt_line = calcWhichSide(pointA, pointB, role.vertices[0])
    const lb_line = calcWhichSide(pointA, pointB, role.vertices[1])
    const rt_line = calcWhichSide(pointA, pointB, role.vertices[2])
    const rb_line = calcWhichSide(pointA, pointB, role.vertices[3])
    const role_line = lt_line.gt(0).and(lb_line.gt(0)).and(rt_line.gt(0)).and(rb_line.gt(0))
    isOutside = isOutside ? isOutside.or(role_line) : role_line
  })

  return isOutside
}

/** 判斷 pointC 在 lineAB 的哪一側, 外積法 */
function calcWhichSide(pointA: PointSignal, pointB: PointSignal, pointC: PointSignal) {
  // 向量矩陣求外積 vecAB X vecAC
  // [(xb-xa), (yb-ya)]
  // [(xc-xa), (yc-ya)]
  // cross = (xb - xa)*(yc - ya) - (yb - ya)*(xc - xa)
  // 若 cross === 0 在線上, cross > 0 在左側, cross < 0 在右側

  const vectorAB = pointB.sub(pointA)
  const vectorAC = pointC.sub(pointA)

  // 外積求到的是法線向量, 由於計算用的兩向量在 xy 平面, 故此法向量必為 (0, 0, z)
  // 取得 z 可得外積的純量
  return vectorAB.cross(vectorAC).z
}