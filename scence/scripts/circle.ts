import Reactive from 'Reactive'
import Diagnostics from 'Diagnostics'
import { tool } from './tool'

export function runCircle(asset) {
  const user = asset.user as Plane
  const userBBox = tool.getBBox3D(user)

  const circle = asset.circle as Plane
  const circleS = asset.circleS as Plane
  const circleBBox = tool.getBBox3D(circle)
  const circleSBBox = tool.getBBox3D(circleS)

  const circleMat = asset.circleMat as DefaultMaterial
  circleMat.opacity = Reactive.val(0.3)

  // 圓形 vs 矩形
  const isOutsideOut = checkRectOutCircle(circleBBox, userBBox)
  const isInsideIn = checkRectInCircle(circleSBBox, userBBox)
  isOutsideOut.or(isInsideIn).monitor().subscribe((res) => {
    const isHit = res.newValue
    circleMat.opacity = isHit ? Reactive.val(0.3) : Reactive.val(1)
  })

  // 圓形 vs 圓形
  const userCircle = asset.userCircle as Plane
  const userCircleBBox = tool.getBBox3D(userCircle)

  const isOuterOut = circleInCircle(circleBBox, userCircleBBox).not()
  const isInnerIn = intersectCircle(circleSBBox, userCircleBBox)
  isOuterOut.or(isInnerIn).monitor().subscribe((res) => {
    const isHit = res.newValue
    circleMat.opacity = isHit ? Reactive.val(0.3) : Reactive.val(1)
  })
}

/**
 * 碰撞偵測, 矩形是否出圈
 * - source - https://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection
 */
function checkRectOutCircle(circle: BoundingBox3D, rect: BoundingBox3D) {
  let isOut: BoolSignal = null
  rect.vertices.forEach((point) => {
    const isPointOut = pointInCircle(circle, point).not()
    isOut = isOut ? isOut.or(isPointOut) : isPointOut
  })

  return isOut
}

/** 碰撞偵測, 矩形是否進圈 */
function checkRectInCircle(circle: BoundingBox3D, rect: BoundingBox3D) {
  let isIn: BoolSignal = null
  rect.vertices.forEach((point) => {
    const isPointOut = pointInCircle(circle, point)
    isIn = isIn ? isIn.or(isPointOut) : isPointOut
  })

  return isIn
}

/** 需為正圓 */
function pointInCircle(circle: BoundingBox3D, point: PointSignal) {
  // Case 1, 點與圓心的距離 <= 半徑, 取平方數算省效能
  // return point.sub(circle.pivot).magnitudeSquared().le(circle.halfSizeX.pow(2))

  // Case 2, vecAB．vecAB <= r * r (圓心A, 點B)
  // https://gamedev.net/forums/topic/309663-2d-vector-intersection-with-circle-or-box/309663/
  const vecAB = point.sub(circle.pivot)
  const radius = circle.right.sub(circle.pivot.x)
  return vecAB.dot(vecAB).le(radius.mul(radius))
}

/** 目標 circle 是否在 collider 圓內 */
function circleInCircle(colliderCircle: BoundingBox3D, circle: BoundingBox3D) {
  // 半徑
  const r1 = colliderCircle.halfSizeX
  const r2 = circle.halfSizeX
  // 圓心距離
  const squaredDistance = circle.pivot.sub(colliderCircle.pivot).magnitudeSquared()

  return squaredDistance.le(r1.sub(r2).pow(2))
}

/** 兩圓是否相交(碰撞)，需為正圓 */
function intersectCircle(colliderCircle: BoundingBox3D, circle: BoundingBox3D) {
  // 半徑
  const r1 = colliderCircle.halfSizeX
  const r2 = circle.halfSizeX
  // 圓心距離
  const squaredDistance = circle.pivot.sub(colliderCircle.pivot).magnitudeSquared()

  return squaredDistance.le(r1.add(r2).pow(2))
}