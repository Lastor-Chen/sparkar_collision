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

  const colliderMat = asset.colliderMat as DefaultMaterial
  colliderMat.opacity = Reactive.val(0.3)

  // 凸多邊形
  const polygon = asset.n_poly as Polygon
  await tool.setPolygon(polygon)

  Helper.checkSAT(polygon, userBBox).monitor().subscribe(res => {
    const isSeparated = res.newValue
    colliderMat.opacity = isSeparated ? Reactive.val(0.3) : Reactive.val(1)
  })
}

class Helper {
  /** 碰撞偵測, SAT */
  static checkSAT(shapeA: BoundingBox3D | Polygon, shapeB: BoundingBox3D | Polygon) {
    // 取得 shape 上的所有參考軸
    const normalsA = this.getEdgeNormals(shapeA)
    const normalsB = this.getEdgeNormals(shapeB)

    // 檢測參考軸中是否存在分離軸, 如存在表示無碰撞 (矩形情況, 僅需檢查兩軸)
    let hasSA: BoolSignal = null
    for (let idx = 0; idx < normalsA.length; idx++) {
      const isSeparated = this.checkIsSeparated(shapeA, shapeB, normalsA[idx])
      hasSA = hasSA ? hasSA.or(isSeparated) : isSeparated
    }

    let hasSA2: BoolSignal = null
    for (let idx = 0; idx < normalsB.length; idx++) {
      const isSeparated = this.checkIsSeparated(shapeA, shapeB, normalsB[idx])
      hasSA2 = hasSA2 ? hasSA2.or(isSeparated) : isSeparated
    }

    return hasSA.or(hasSA2)
  }

  /** 找出各 edge 的 normals 作為參考軸 */
  static getEdgeNormals(shape: BoundingBox3D | Polygon) {
    const vertices = shape.vertices
    return vertices.map((point, idx) => {
      const nextPoint = vertices[idx + 1] || vertices[0]
      const vec = nextPoint.sub(point)
      return this.getVec2LeftNormal(vec)
    })
  }

  /** 判斷 axis 是否為 shapeA 與 shapeB 的分離軸 */
  static checkIsSeparated(shapeA: BoundingBox3D | Polygon, shapeB: BoundingBox3D | Polygon, axis: PointSignal) {
    // 取得最大最小投影長
    const { min: aMin, max: aMax } = this.getMaxMin(shapeA, axis)
    const { min: bMin, max: bMax } = this.getMaxMin(shapeB, axis)

    // A.max < B.min || B.max < A.min
    return aMax.lt(bMin).or(bMax.lt(aMin))
  }

  /** 計算 shape 在分離軸上之最大, 最小投影 */
  static getMaxMin(shape: BoundingBox3D | Polygon, axis: PointSignal) {
    // 取得 4 個角
    const vertices = shape.vertices;

    let max: ScalarSignal = null
    let min: ScalarSignal = null
    vertices.forEach(point => {
      const length = this.getProjectLength(point, axis)
      max = max ? Reactive.max(max, length) : length
      min = min ? Reactive.min(min, length) : length
    })

    return { min, max }
  }

  /** 取得 vecA 在 vecB 上的投影長 */
  static getProjectLength(vecA: PointSignal, vecB: PointSignal) {
    const dotAB = vecA.dot(vecB)
    const bLength = vecB.magnitude()
    return dotAB.div(bLength)
  }

  /** 回傳輸入向量的左側法向量, z = 0 */
  static getVec2LeftNormal(vector: PointSignal | Point2DSignal) {
    return Reactive.point(vector.y.neg(), vector.x, 0)
  }

  /** 回傳輸入向量的右側法向量, z = 0 */
  static getVec2RightNormal(vector: PointSignal | Point2DSignal) {
    return Reactive.point(vector.y, vector.x.neg(), 0)
  }
}
