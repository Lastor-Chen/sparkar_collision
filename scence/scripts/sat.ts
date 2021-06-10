import Scene from 'Scene'
import Reactive from 'Reactive'
import Diagnostics from 'Diagnostics'
import { tool } from './tool'

// source:
// https://davidhsu666.com/archives/gamecollisiondetection/

/**
 * - 可處理凸多邊型, 如僅處理矩形, 可進一步優化
 * - 應該比左右側法運算量大許多
 * - 此算法只要找到一條分離軸就能 return 結果, 比較適用於 setInterval
 * - 這邊使用 sparkAR 響應式 API 處理
 */
export async function runSAT(asset) {
  const user = asset.user as Plane
  const userBBox = tool.getBBox3d(user, { useRotation: true })

  const plane = asset.sat_plane as Plane
  const planeBBox = tool.getBBox3d(plane, { useRotation: true })

  const colliderMat = asset.colliderMat as DefaultMaterial
  colliderMat.opacity = Reactive.val(0.3)

  checkSAT(planeBBox, userBBox).monitor().subscribe(res => {
    const isSeparated = res.newValue
    colliderMat.opacity = isSeparated ? Reactive.val(0.3) : Reactive.val(1)
  })
}

/** 碰撞偵測, SAT */
function checkSAT(rectA: BoundingBox3D, rectB: BoundingBox3D) {
  // 取得參考軸
  const normalsA = getRectNormals(rectA)
  const normalsB = getRectNormals(rectB)

  // 找出分離軸, 如存在表示無發生碰撞
  let hasSA: BoolSignal = null
  normalsA.forEach((axis) => {
    // 取得最大最小投影長
    const { min: aMin, max: aMax } = getMaxMin(rectA, axis)
    const { min: bMin, max: bMax } = getMaxMin(rectB, axis)

    // A.max < B.min || B.max < A.min
    const isSeparated = aMax.lt(bMin).or(bMax.lt(aMin))
    hasSA = hasSA ? hasSA.or(isSeparated) : isSeparated
  })

  let hasSA2: BoolSignal = null
  normalsB.forEach((axis) => {
    // 取得最大最小投影長
    const { min: aMin, max: aMax } = getMaxMin(rectA, axis)
    const { min: bMin, max: bMax } = getMaxMin(rectB, axis)

    // A.max < B.min || B.max < A.min
    const isSeparated = aMax.lt(bMin).or(bMax.lt(aMin))
    hasSA2 = hasSA2 ? hasSA2.or(isSeparated) : isSeparated
  })

  return hasSA.or(hasSA2)
}

/** 計算 rect 在分離軸上之最大, 最小投影 */
function getMaxMin(rect: BoundingBox3D, axis: PointSignal) {
  // 取得 4 個角
  const vertices = rect.vertices;

  let max: ScalarSignal = null
  let min: ScalarSignal = null
  vertices.forEach(point => {
    const length = getProjectLength(point, axis)
    max = max ? Reactive.max(max, length) : length
    min = min ? Reactive.min(min, length) : length
  })

  return { min, max }
}

/** 取得 vecA 在 vecB 上的投影長 */
function getProjectLength(vecA: PointSignal, vecB: PointSignal) {
  const dotAB = vecA.dot(vecB)
  const bLength = vecB.magnitude()
  return dotAB.div(bLength)
}

function getRectNormals(rect: BoundingBox3D) {
  const vertices = rect.vertices
  return vertices.map((point, idx) => {
    const nextPoint = vertices[idx + 1] || vertices[0]
    const vec = nextPoint.sub(point)
    return getVec2LeftNormal(vec)
  })
}

/** 回傳輸入向量的左側法向量, z = 0 */
function getVec2LeftNormal(vector: PointSignal | Point2DSignal) {
  return Reactive.point(vector.y.neg(), vector.x, 0)
}

/** 回傳輸入向量的右側法向量, z = 0 */
function getVec2RightNormal(vector: PointSignal | Point2DSignal) {
  return Reactive.point(vector.y, vector.x.neg(), 0)
}