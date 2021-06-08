import Reactive from 'Reactive'
import Diagnostics from 'Diagnostics'
import { tool } from './tool'

export function runCircle(asset) {
  const user = asset.user as Plane
  const userBBox = tool.genBoundingBox3DWithRotation(user)

  const circle = asset.circle as Plane
  const circleS = asset.circleS as Plane
  const circleBBox = tool.genBoundingBox3D(circle)
  const circleSBBox = tool.genBoundingBox3D(circleS)

  const circleMat = asset.circleMat as DefaultMaterial

  const outer = checkRectOutCircle(circleBBox, userBBox)
  const inner = checkRectInCircle(circleSBBox, userBBox)
  outer.or(inner).monitor().subscribe((res) => {
    if (res.newValue) {
      circleMat.diffuseColorFactor = Reactive.RGBA(1, 0, 0, 1)
    } else {
      circleMat.diffuseColorFactor = Reactive.RGBA(0, 1, 1, 1)
    }
  })
}

/**
 * 碰撞偵測, 矩形是否出圈
 * - source - https://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection
 */
function checkRectOutCircle(circle: BoundingBox3D, rect: BoundingBox3D) {
  const ltOut = pointInCircle(circle, rect.pointLT).not()
  const rtOut = pointInCircle(circle, rect.pointRT).not()
  const rbOut = pointInCircle(circle, rect.pointRB).not()
  const lbOut = pointInCircle(circle, rect.pointLB).not()

  return ltOut.or(rtOut).or(rbOut).or(lbOut)
}

/** 碰撞偵測, 矩形是否進圈 */
function checkRectInCircle(circle: BoundingBox3D, rect: BoundingBox3D) {
  const ltOut = pointInCircle(circle, rect.pointLT)
  const rtOut = pointInCircle(circle, rect.pointRT)
  const rbOut = pointInCircle(circle, rect.pointRB)
  const lbOut = pointInCircle(circle, rect.pointLB)

  return ltOut.or(rtOut).or(rbOut).or(lbOut)
}

/** 需為正圓 */
function pointInCircle(circle: BoundingBox3D, point: PointSignal) {
  // 點與圓心的距離 <= 半徑, 取平方數算省效能
  // return point.sub(circle.pivot).magnitudeSquared().le(circle.halfSizeX.pow(2))

  // vecAB．vecAB <= r * r (圓心A, 點B)
  // https://gamedev.net/forums/topic/309663-2d-vector-intersection-with-circle-or-box/309663/
  const vecAB = point.sub(circle.pivot)
  const radius = circle.halfSizeX
  return vecAB.dot(vecAB).le(radius.mul(radius))
}