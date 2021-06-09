import Reactive from 'Reactive'
import Diagnostics from 'Diagnostics'

export function runAABB(asset) {
  const user = asset.user as Plane
  const userBBox = getBBox3D(user)

  const plane = asset.AABB_plane as Plane
  const planeBBox = getBBox3D(plane)

  const colliderMat = asset.colliderMat as DefaultMaterial
  colliderMat.opacity = Reactive.val(0.3)

  checkHit3D(planeBBox, userBBox).monitor().subscribe(res => {
    const isHit = res.newValue
    colliderMat.opacity = isHit ? Reactive.val(1) : Reactive.val(0.3)
  })
}

/**
 * 對 3D 物件生成 z 恆為 0 的 Bounding Box
 * - parent?: 計算父層 transform
 */
function getBBox3D(obj: Plane, parent?: SceneObjectBase): BoundingBox3D {
  const posX = parent ?
    parent.transform.x.add(obj.transform.x.mul(parent.transform.scale.x)) :
    obj.transform.x
  const posY = parent ?
    parent.transform.y.add(obj.transform.y.mul(parent.transform.scale.y)) :
    obj.transform.y

  // (width * scaleX * parent.scaleY)/2
  const halfSizeX = parent ?
    obj.width.mul(obj.transform.scaleX).mul(parent.transform.scaleX).div(2) :
    obj.width.mul(obj.transform.scaleX).div(2)
  // (height * scaleY * parent.scaleY)/2
  const halfSizeY = parent ?
    obj.height.mul(obj.transform.scaleY).mul(parent.transform.scaleY).div(2) :
    obj.height.mul(obj.transform.scaleY).div(2)

  return {
    pivot: Reactive.point(posX, posY, 0),
    pointLT: Reactive.point(posX.sub(halfSizeX), posY.add(halfSizeY), 0),
    pointLB: Reactive.point(posX.sub(halfSizeX), posY.sub(halfSizeY), 0),
    pointRT: Reactive.point(posX.add(halfSizeX), posY.add(halfSizeY), 0),
    pointRB: Reactive.point(posX.add(halfSizeX), posY.sub(halfSizeY), 0),
    left: posX.sub(halfSizeX),
    top: posY.add(halfSizeY),
    right: posX.add(halfSizeX),
    bottom: posY.sub(halfSizeY),
    halfSizeX: halfSizeX,
    halfSizeY: halfSizeY,
  }
}

/** 碰撞偵測, 對稱軸包圍盒 */
function checkHit3D(rectA: BoundingBox3D, rectB: BoundingBox3D) {
  // X軸碰撞, A.right > B.left && B.right > A.left
  const xIn = rectA.right.gt(rectB.left).and(rectB.right.gt(rectA.left))

  // Y軸碰撞, A.top > B.btm && B.top > A.btm
  const yIn = rectA.top.gt(rectB.bottom).and(rectB.top.gt(rectA.bottom))

  return xIn.and(yIn)
}