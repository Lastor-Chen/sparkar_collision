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

/** Collision detection via rectangle overlap */
function checkHit3D(collider: BoundingBox3D, role: BoundingBox3D) {
  const itemTop = collider.top
  const itemBtm = collider.bottom
  const itemLeft = collider.left
  const itemRight = collider.right
  const roleTop = role.top
  const roleBtm = role.bottom
  const roleLeft = role.left
  const roleRight = role.right

  // X軸碰撞, 檢查是否交疊
  // (itemLeft < roleLeft < itemRight) || (itemLeft < roleRight < itemRight)
  const roleLeftIn = itemLeft.lt(roleLeft).and(roleLeft.lt(itemRight))
  const roleRightIn = itemLeft.lt(roleRight).and(roleRight.lt(itemRight))
  // (roleLeft < itemLeft < roleRight) || (roleLeft < itemReft < roleRight)
  const itemLeftIn = roleLeft.lt(itemLeft).and(itemLeft.lt(roleRight))
  const itemRightIn = roleLeft.lt(itemRight).and(itemRight.lt(roleRight))
  const xIn = roleLeftIn.or(roleRightIn).or(itemLeftIn).or(itemRightIn)

  // Y軸碰撞, 檢查是否交疊
  // (itemTop > roleTop > itemBtm) || (itemTop > roleBtm > itemBtm)
  const roleTopIn = itemTop.gt(roleTop).and(roleTop.gt(itemBtm))
  const roleBtmIn = itemTop.gt(roleBtm).and(roleBtm.gt(itemBtm))
  // (roleTop > itemTop > roleBtm) || (roleTop > itemBtm > roleBtm)
  const itemTopIn = roleTop.gt(itemTop).and(itemTop.gt(roleBtm))
  const itemBtmIn = roleTop.gt(itemBtm).and(itemBtm.gt(roleBtm))
  const yIn = roleTopIn.or(roleBtmIn).or(itemTopIn).or(itemBtmIn)

  return xIn.and(yIn)
}