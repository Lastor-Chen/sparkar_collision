/// <reference path="index.d.ts" />
import { queryAsset } from './find_api'
import { runAABB } from './aabb'
import { runLeftRight } from './left_right'
import { runMultiLines } from './multi_lines'
import { runCircle } from './circle'
import { runGJK } from './gjk'

(async function () {
  const asset = await queryAsset()

  // 矩形-矩形, 軸對稱包圍盒 (Axis-Aligned Bounding Box), 無旋轉
  // runAABB(asset)

  // 矩形-矩形, 左右側判定法, 可旋轉
  // runLeftRight(asset)

  // 直線式道路, 連續線段判定, 左右側法
  // runMultiLines(asset)

  // 圓形-圓形 or 圓形-矩形, 半徑法
  runCircle(asset)

  // runGJK(asset)
})();

/**
 * 點是否在矩形內(旋轉可), 內積法
 * - source - https://math.stackexchange.com/questions/190111/how-to-check-if-a-point-is-inside-a-rectangle
 */
function pointInRectByDot(point: PointSignal, rectBBox: BoundingBox3D) {
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
}

/** 點是否在矩形內(無旋轉), 傳統法 */
function pointInRect(point: PointSignal, rectBBox: BoundingBox3D) {
  // rectLeft <= pointX <= rectRight
  const xIn = rectBBox.left.le(point.x).and(point.x.le(rectBBox.right))
  // rectBottom <= pointY <= rectTop
  const yIn = rectBBox.bottom.le(point.y).and(point.y.le(rectBBox.top))

  return xIn.and(yIn)
}

/**
 * 線是否相交於圓, 外積
 * - source - https://mathworld.wolfram.com/Circle-LineIntersection.html
 */
function intersectLineCircle(pointA: PointSignal, pointB: PointSignal, circle: BoundingBox3D) {
  const radius = circle.halfSizeX
  // 兩點距離的平方
  const squaredDistance = pointB.sub(pointA).magnitudeSquared()
  // 外積, cross product
  const cross = pointA.cross(pointB).magnitude()

  // res = 0 相切, res > 0 相交
  return radius.pow(2).mul(squaredDistance).sub(cross.pow(2)).ge(0)
}

/**
 * 線是否相交於圓, 內積 + 畢式定理
 * - source - https://gamedev.net/forums/topic/309663-2d-vector-intersection-with-circle-or-box/309663/
 */
function intersectVectorCircle(pointA: PointSignal, pointB: PointSignal, circle: BoundingBox3D) {
  const radius = circle.halfSizeX
  // pointC is circle center
  const vecAC = circle.pivot.sub(pointA)
  const vecAB = pointB.sub(pointA)
  // vecCA 到 vecAB 的正射影長
  const projectLength = vecAC.dot(vecAB).div(vecAB.magnitude())
  // 畢式定理, pointC 到 vecAB 的距離平方
  const distanceSquared = vecAC.dot(vecAC).sub(projectLength.pow(2))
  return distanceSquared.le(radius.pow(2))
}

/** 點到線之距離, pointC to lineAB */
function distancePointToLine(pointA: PointSignal, pointB: PointSignal, pointC: PointSignal) {
  // 3維: https://onlinemschool.com/math/library/analytic_geometry/p_line/
  const vecAP = pointC.sub(pointA)
  const vecAB = pointB.sub(pointA)
  return vecAP.cross(vecAB).magnitude().div(vecAB.magnitude())

  // 2維: https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
  // (x2 - x1)(y1 - y) - (x1 - x)(y2 - y1) / √(x2 - x1)^2 + (y2 - y1)^2
  // return pointB.x.sub(pointA.x).mul(pointA.y.sub(pointC.y)).sub(pointA.x.sub(pointC.x).mul(pointB.y.sub(pointA.y)))
  //         .div(pointB.sub(pointA).magnitude())
}