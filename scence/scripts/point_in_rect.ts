import Reactive from 'Reactive'
import Diagnostics from 'Diagnostics'
import { tool } from './tool'

export function runPointInRect(asset) {
  const user = asset.user as Plane
  const userBBox = tool.getBBox3d(user, { useRotation: true })

  const plane = asset.pInR_plane as Plane
  const planeBBox = tool.getBBox3d(plane, { useRotation: true })

  const colliderMat = asset.colliderMat as DefaultMaterial
  colliderMat.opacity = Reactive.val(0.3)

  checkHit3D(userBBox, planeBBox).monitor().subscribe(res => {
    const isHit = res.newValue
    colliderMat.opacity = isHit ? Reactive.val(1) : Reactive.val(0.3)
  })
}

/** 碰撞偵測, 點包含法 */
function checkHit3D(rectA: BoundingBox3D, rectB: BoundingBox3D) {
  let aInB: BoolSignal = null
  rectA.vertices.forEach(point => {
    const isPointIn = pointInRect(point, rectB)
    aInB = aInB ? aInB.or(isPointIn) : isPointIn
  })

  let bInA: BoolSignal = null
  rectB.vertices.forEach(point => {
    const isPointIn = pointInRect(point, rectA)
    bInA = bInA ? bInA.or(isPointIn) : isPointIn
  })

  return aInB.or(bInA)
}

/**
 * 點是否在矩形內(旋轉可), 內積法
 * - source - https://math.stackexchange.com/questions/190111/how-to-check-if-a-point-is-inside-a-rectangle
 */
function pointInRect(point: PointSignal, rect: BoundingBox3D) {
  // rect(A,B,C,D) 點位順時針 vs point(P)
  const [pointA, pointB, _, pointD] = rect.vertices
  const vecAB = pointB.sub(pointA)
  const vecAD = pointD.sub(pointA)
  const vecAP = point.sub(pointA)

  // 公式: (0 ≤ AP·AB ≤ AB·AB) and (0 ≤ AP·AD ≤ AD·AD)
  const yIn = vecAP.dot(vecAB).ge(0).and(vecAP.dot(vecAB).le(vecAB.dot(vecAB)))
  const xIn = vecAP.dot(vecAD).ge(0).and(vecAP.dot(vecAD).le(vecAD.dot(vecAD)))
  return xIn.and(yIn)
}