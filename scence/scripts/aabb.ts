import Reactive from 'Reactive'
import Diagnostics from 'Diagnostics'
import { tool } from './tool'

// 說明
// https://link.medium.com/sxBeXqKEZgb 

export function runAABB(asset) {
  const user = asset.user as Plane
  const userBBox = tool.getBBox3d(user)

  const plane = asset.AABB_plane as Plane
  const planeBBox = tool.getBBox3d(plane)

  const colliderMat = asset.colliderMat as DefaultMaterial
  colliderMat.opacity = Reactive.val(0.3)

  checkHit3D(planeBBox, userBBox).monitor().subscribe(res => {
    const isHit = res.newValue
    colliderMat.opacity = isHit ? Reactive.val(1) : Reactive.val(0.3)
  })
}

/** 碰撞偵測, AABB */
function checkHit3D(rectA: BoundingBox3D, rectB: BoundingBox3D) {
  // X軸碰撞, A.right > B.left && B.right > A.left
  const xIn = rectA.right.gt(rectB.left).and(rectB.right.gt(rectA.left))
  // Y軸碰撞, A.top > B.btm && B.top > A.btm
  const yIn = rectA.top.gt(rectB.bottom).and(rectB.top.gt(rectA.bottom))

  return xIn.and(yIn)
}