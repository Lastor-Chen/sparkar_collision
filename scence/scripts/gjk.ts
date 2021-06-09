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
  const userBBox = tool.getBBox3D(user)

  const colliderMat = asset.colliderMat as DefaultMaterial
  colliderMat.opacity = Reactive.val(1)

  // 凸四邊形
  const trapezium = asset.gjk_trapezium as Trapezium
  const vertices = await trapezium.findByPath('rect0/vertex*')

  // 計算父層 position, scale
  trapezium.vertices = vertices.map(vertex =>
    vertex.transform.position.mul(trapezium.transform.scale).add(trapezium.transform.position)
  )
  trapezium.pivot = trapezium.transform.position

  Time.setInterval(() => {
    const isHit = checkGJK(userBBox, trapezium)

    // 變材質球會當掉, 改用文字顯示
    status.text = isHit ? Reactive.val('true') : Reactive.val('false')
  }, 1000)
}

function checkGJK(shapeA: BoundingBox3D, shapeB: BoundingBox3D | Trapezium) {
  const vertices: PointSignal[] = []
  let direction: PointSignal = null
  while (true) {
    switch (vertices.length) {
      case 0: { // 先根據兩者的 center 向量方向, 找第一個 SP
        direction = shapeB.pivot.sub(shapeA.pivot) as unknown as PointSignal
        break
      }
      case 1: { // 以顛倒的 center 向量, 找第二點
        direction = direction.mul(-1) as unknown as PointSignal
        break
      }
      case 2: { // 利用上面兩點 spA, spB 之法向量方向, 找第三點
        const spB = vertices[1]
        const spC = vertices[0]

        const vecCB = spB.sub(spC)
        const vecC0 = Reactive.point(0, 0, 0).sub(spC)

        direction = vecCB.cross(vecC0).cross(vecCB)
        break
      }
      case 3: { // 判斷三點區域, 是否包含原點
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
          return true
        }
        break
      }
    }

    if (!addSupportPoint(direction)) return false
  }

  function addSupportPoint(direction: PointSignal) {
    const directionNeg = direction.neg() as unknown as PointSignal

    const sp = getSupportPoint(shapeA, direction).sub(getSupportPoint(shapeB, directionNeg))
    vertices.push(sp)

    return direction.dot(sp).pinLastValue() >= 0
  }
}

/** 求 shape 在在方向上最遠的 point */
function getSupportPoint(shape: BoundingBox3D | Trapezium, direction: PointSignal): PointSignal {
  // 用負無限大, 因下方比大小時, distance 有可能負數
  let furthestDistance = -Infinity
  let furthestPoint: PointSignal = null

  shape.vertices.forEach(point => {
    const distance = point.dot(direction).pinLastValue()

    if (distance > furthestDistance) {
      furthestDistance = distance
      furthestPoint = point
    }
  })

  return furthestPoint
}
