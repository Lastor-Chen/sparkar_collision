import Reactive from 'Reactive'
import Diagnostics from 'Diagnostics'
import { tool } from './tool'
import Time from 'Time'

// source:
// https://bwaynesu.wordpress.com/2018/09/10/gjk-collision-detection/?fbclid=IwAR3YCVEgsuRLhdYKgg3n2WUBfaKvZL2rXZuvFpHD4gJhaf4xOUOKJZcdphY

/**
 * 不適用 sparkAR
 * - 需要用 setInterval 處理, 用響應式 API 寫不出來
 * - 遍歷找 simplex 運算成本似乎很高, sparkAR 跑一陣子會崩潰
 * - 如全改成 pinLastValue 的方式, 效能應該會高些
 */
export async function runGJK(asset) {
  const status = asset.gjk_status as PlanarText
  const user = asset.user as Plane
  const userBBox = tool.getBBox3d(user, { useRotation: true })

  const colliderMat = asset.colliderMat as DefaultMaterial
  colliderMat.opacity = Reactive.val(1)

  // 凸四邊形
  const trapezium = asset.gjk_trapezium as Polygon
  await tool.setPolygon(trapezium)

  // 設置 callback per frame
  const fps = 2
  Time.setInterval(() => {
    const isHit = Helper.checkGJK(userBBox, trapezium)
    // 變材質球會當掉, 改用文字顯示
    status.text = isHit ? Reactive.val('true') : Reactive.val('false')
  }, 1000 / fps)
}

class Helper {
  /** 碰撞偵測, GJK */
  static checkGJK(shapeA: BoundingBox3D | Polygon, shapeB: BoundingBox3D | Polygon) {
    /** Simplex 上的頂點們 */
    const vertices: PointSignal[] = []
    let direction: PointSignal = null

    /** 找出 Minkowski Difference 在該方向上的最遠點, 紀錄該點, 並回傳是否同方向 */
    const addSupportPoint = () => {
      const directionNeg = direction.neg() as unknown as PointSignal

      // Simplex 在該方向上的最遠點為 sp = shapeA.sp - shapeB.sp.逆向
      const spA = this.getSupportPoint(shapeA, direction)
      const spB = this.getSupportPoint(shapeB, directionNeg)
      const sp = spA.sub(spB)

      vertices.push(sp)
      return direction.dot(sp).pinLastValue() >= 0
    }

    // 遍歷找出兩 shape 在 Minkowski Difference 上面的 Simplex
    // 如該 Simplex 包含空間原點, 表示發生碰撞
    let result = false
    while (true) {
      if (vertices.length === 0) {
        // 先根據兩者的 center 向量方向, 找第一個 SP
        direction = shapeB.pivot.sub(shapeA.pivot).pinLastValue() as unknown as PointSignal
      } else if (vertices.length === 1) {
        // 以顛倒的 center 向量, 找第二點
        direction = direction.mul(-1) as unknown as PointSignal
      } else if (vertices.length === 2) {
        // 利用上面兩點 spA, spB 之法向量方向, 找第三點
        const spB = vertices[1]
        const spC = vertices[0]

        const vecCB = spB.sub(spC)
        const vecC0 = Reactive.point(0, 0, 0).sub(spC)

        direction = vecCB.cross(vecC0).cross(vecCB)
      } else if (vertices.length === 3) {
        // 判斷三點區域, 是否包含原點
        const spA = vertices[2]
        const spB = vertices[1]
        const spC = vertices[0]

        const vecA0 = Reactive.point(0, 0, 0).sub(spA)
        const vecAB = spB.sub(spA)
        const vecAC = spC.sub(spA)

        const abPerp = vecAC.cross(vecAB).cross(vecAB)
        const acPerp = vecAB.cross(vecAC).cross(vecAC)

        if (abPerp.dot(vecA0).pinLastValue() > 0) {
          // 原點在 vecAB 外, 重找
          vertices.splice(2, 1)
          direction = abPerp
        } else if (acPerp.dot(vecA0).pinLastValue() > 0) {
          // 原點在 vecAC 外, 重找
          vertices.splice(2, 1)
          direction = acPerp
        } else {
          result = true
          break
        }
      }

      const isSameDir = addSupportPoint()
      if (!isSameDir) break
    }

    return result
  }

  /** 取得 shape 在給定方向上最遠的 point */
  static getSupportPoint(shape: BoundingBox3D | Polygon, direction: PointSignal): PointSignal {
    // 用負無限大, 因下方比大小時, distance 有可能負數
    let furthestDistance = -Infinity
    let furthestPoint: PointSignal = null

    shape.vertices.forEach(point => {
      const distance = point.dot(direction).pinLastValue()

      if (distance > furthestDistance) {
        furthestDistance = distance
        furthestPoint = point.pinLastValue()
      }
    })

    return furthestPoint
  }
}
