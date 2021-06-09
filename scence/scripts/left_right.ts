import Reactive from 'Reactive'
import Diagnostics from 'Diagnostics'

// 判斷左右側
// https://stackoverflow.com/questions/1560492/how-to-tell-whether-a-point-is-to-the-right-or-left-side-of-a-line

export function runLeftRight(asset) {
  const user = asset.user as Plane
  const userBBox = getBBox3D(user)

  const colliderMat = asset.colliderMat as DefaultMaterial
  colliderMat.opacity = Reactive.val(0.3)

  // 矩形
  const plane = asset.leftRight_plane as Plane
  const planeBBox = getBBox3D(plane)

  checkHit3D(planeBBox, userBBox).monitor().subscribe(res => {
    const isHit = res.newValue
    colliderMat.opacity = isHit ? Reactive.val(1) : Reactive.val(0.3)
  })

  // 凸四邊形
  const trapezium = asset.leftRight_trapezium as Trapezium
  const vertices = asset.leftRight_vertices as SceneObject[]
  trapezium.vertices = vertices.map(point =>
    point.transform.position.mul(trapezium.transform.scale).add(trapezium.transform.position)
  )

  checkHit3D(trapezium, userBBox).monitor().subscribe(res => {
    const isHit = res.newValue
    colliderMat.opacity = isHit ? Reactive.val(1) : Reactive.val(0.3)
  })
}

/**
 * 對 3D 物件生成 z 恆為 0 的 Bounding Box, 含旋轉
 * - parent?: 計算父層 transform
 */
function getBBox3D(obj: Plane, parent?: SceneObjectBase): BoundingBox3D {
  const posX = parent ?
    parent.transform.x.add(obj.transform.x.mul(parent.transform.scale.x)) :
    obj.transform.x
  const posY = parent ?
    parent.transform.y.add(obj.transform.y.mul(parent.transform.scale.y)) :
    obj.transform.y

  // Get the half size
  let halfSizeX: ScalarSignal = parent ?
    obj.width.mul(obj.transform.scale.x).mul(parent.transform.scale.x).div(2) :
    obj.width.mul(obj.transform.scale.x).div(2)
  let halfSizeY: ScalarSignal = parent ?
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
  const pointLT = Reactive.pack2(rotatePoint2D(originPointLT, pivot, rotationZ), 0)
  const pointLB = Reactive.pack2(rotatePoint2D(originPointLB, pivot, rotationZ), 0)
  const pointRT = Reactive.pack2(rotatePoint2D(originPointRT, pivot, rotationZ), 0)
  const pointRB = Reactive.pack2(rotatePoint2D(originPointRB, pivot, rotationZ), 0)

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
  }
}

/** Rotate a point2D around center(0,0) */
function rotatePoint2D(point2D: Point2DSignal, pivot: Point2DSignal, radians: ScalarSignal) {
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
}

/** 碰撞偵測, 左右側法 */
function checkHit3D(collider: BoundingBox3D | Trapezium, role: BoundingBox3D) {
  // 順時針方向
  const [pointA, pointB, pointC, pointD] = collider.vertices

  let isInside: BoolSignal = null
  role.vertices.forEach((point) => {
    const pointToLineAB = calcWhichSide(pointA, pointB, point).le(0)
    const pointToLineBC = calcWhichSide(pointB, pointC, point).le(0)
    const pointToLineCD = calcWhichSide(pointC, pointD, point).le(0)
    const pointToLineDA = calcWhichSide(pointD, pointA, point).le(0)

    const point_collider = pointToLineAB.and(pointToLineBC).and(pointToLineCD).and(pointToLineDA)

    isInside = isInside ? isInside.or(point_collider) : point_collider
  })

  return isInside
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

/**
 * 判斷 point 在 lineAB 的哪一側, 直線方程式法
 * - point - target point3D
 * - linePointA - start point of a line
 * - linePointB - end point of a line
 */
function calcWhichSideOld(pointA: PointSignal, pointB: PointSignal, point: PointSignal) {
  // 使用直線方程式 "一般式" => Ax + By + C = 0
  // 將目標 point 帶入求得值 D, 若 D === 0 在線上, D > 0 在右側, D < 0 在左側
  // 透過 "兩點式" 反推可得 A, B, C 帶入一般式得到此 line 的直線方程式
  // D = (y2 - y1)x + (x1 - x2)y + (x2 * y1 - x1 * y2)
  return point.x
    .mul(pointB.y.sub(pointA.y))
    .add(point.y.mul(pointA.x.sub(pointB.x)))
    .add(pointB.x.mul(pointA.y).sub(pointA.x.mul(pointB.y)))
}