import Reactive from 'Reactive'

export const tool = {
  /**
   * Return BoundingBox3D.
   * Generate a virtual 2D bounding box for plane in 3D coordinate system.
   */
  genBoundingBox3D(obj: SceneObjectBase, parent?: SceneObjectBase): BoundingBox3D {
    const posX = parent ?
      parent.transform.x.add(obj.transform.x.mul(parent.transform.scale.x)) :
      obj.transform.x
    const posY = parent ?
      parent.transform.y.add(obj.transform.y.mul(parent.transform.scale.y)) :
      obj.transform.y
    const posZ = parent ?
      parent.transform.z.add(obj.transform.z.mul(parent.transform.scale.z)) :
      obj.transform.z
    const halfSizeX = parent ?
      obj.width.mul(obj.transform.scale.x).mul(parent.transform.scale.x).div(2) :
      obj.width.mul(obj.transform.scale.x).div(2)
    const halfSizeY = parent ?
      obj.height.mul(obj.transform.scale.y).mul(parent.transform.scale.y).div(2) :
      obj.height.mul(obj.transform.scale.y).div(2)

    return {
      pointLT: Reactive.point(posX.sub(halfSizeX), posY.add(halfSizeY), posZ),
      pointLB: Reactive.point(posX.sub(halfSizeX), posY.sub(halfSizeY), posZ),
      pointRT: Reactive.point(posX.add(halfSizeX), posY.add(halfSizeY), posZ),
      pointRB: Reactive.point(posX.add(halfSizeX), posY.sub(halfSizeY), posZ),
      left: posX.sub(halfSizeX),
      top: posY.add(halfSizeY),
      right: posX.add(halfSizeX),
      bottom: posY.sub(halfSizeY),
      pivot: Reactive.point(posX, posY, posZ),
      halfSizeX: halfSizeX,
      halfSizeY: halfSizeY,
    }
  },

  /**
   * Return BoundingBox3D.
   * Generate a virtual 2D bounding box for plane in 3D coordinate system.
   */
  genBoundingBox3DWithRotation(
    obj: SceneObjectBase,
    config: { parent?: SceneObjectBase } = {}
  ): BoundingBox3D {
    const parent = config.parent

    const posX = parent ?
      parent.transform.x.add(obj.transform.x.mul(parent.transform.scale.x)) :
      obj.transform.x
    const posY = parent ?
      parent.transform.y.add(obj.transform.y.mul(parent.transform.scale.y)) :
      obj.transform.y
    // const posZ = parent ?
    //   parent.transform.z.add(obj.transform.z.mul(parent.transform.scale.z)) :
    //   obj.transform.z

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

    // Rotate the plane
    const pointLT = tool.rotatePoint2D(originPointLT, pivot, rotationZ)
    const pointLB = tool.rotatePoint2D(originPointLB, pivot, rotationZ)
    const pointRT = tool.rotatePoint2D(originPointRT, pivot, rotationZ)
    const pointRB = tool.rotatePoint2D(originPointRB, pivot, rotationZ)

    return {
      pivot: Reactive.point(posX, posY, 0),
      pointLT: Reactive.point(pointLT.x, pointLT.y, 0),
      pointLB: Reactive.point(pointLB.x, pointLB.y, 0),
      pointRT: Reactive.point(pointRT.x, pointRT.y, 0),
      pointRB: Reactive.point(pointRB.x, pointRB.y, 0),
      left: posX.sub(halfSizeX),
      top: posY.add(halfSizeY),
      right: posX.add(halfSizeX),
      bottom: posY.sub(halfSizeY),
    }
  },

  /**
   * rotate a point2D around center (0,0)
   * - x' = x * cos(θ) - y * sin(θ)
   * - y' = x * sin(θ) + y * cos(θ)
   */
  rotatePoint2D(point2D: Point2DSignal, pivot: Point2DSignal, radians: ScalarSignal) {
    const { x, y } = point2D
    return Reactive.point2d(
      x.sub(pivot.x).mul(Reactive.cos(radians)).sub(y.sub(pivot.y).mul(Reactive.sin(radians))).add(pivot.x),
      x.sub(pivot.x).mul(Reactive.sin(radians)).add(y.sub(pivot.y).mul(Reactive.cos(radians))).add(pivot.y),
    )
  },

  /** Collision detection via rectangle overlap */
  checkHit3D(itemBBox: BoundingBox3D, roleBBox: BoundingBox3D) {
    const itemTop = itemBBox.top
    const itemBtm = itemBBox.bottom
    const itemLeft = itemBBox.left
    const itemRight = itemBBox.right
    const roleTop = roleBBox.top
    const roleBtm = roleBBox.bottom
    const roleLeft = roleBBox.left
    const roleRight = roleBBox.right

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
  },

  /** Collision detection via linear equation */
  checkHit3DWithRotation(itemBBox: BoundingBox3D, roleBBox: BoundingBox3D) {
    const lt_line_0 = tool.calcWhichSide(roleBBox.pointLT, itemBBox.pointLT, itemBBox.pointRT)
    const lt_line_1 = tool.calcWhichSide(roleBBox.pointLT, itemBBox.pointRT, itemBBox.pointRB)
    const lt_line_2 = tool.calcWhichSide(roleBBox.pointLT, itemBBox.pointRB, itemBBox.pointLB)
    const lt_line_3 = tool.calcWhichSide(roleBBox.pointLT, itemBBox.pointLB, itemBBox.pointLT)
    const roleLTIn = lt_line_0.ge(0).and(lt_line_1.ge(0)).and(lt_line_2.ge(0)).and(lt_line_3.ge(0))

    const rt_line_0 = tool.calcWhichSide(roleBBox.pointRT, itemBBox.pointLT, itemBBox.pointRT)
    const rt_line_1 = tool.calcWhichSide(roleBBox.pointRT, itemBBox.pointRT, itemBBox.pointRB)
    const rt_line_2 = tool.calcWhichSide(roleBBox.pointRT, itemBBox.pointRB, itemBBox.pointLB)
    const rt_line_3 = tool.calcWhichSide(roleBBox.pointRT, itemBBox.pointLB, itemBBox.pointLT)
    const roleRTIn = rt_line_0.ge(0).and(rt_line_1.ge(0)).and(rt_line_2.ge(0)).and(rt_line_3.ge(0))

    const rb_line_0 = tool.calcWhichSide(roleBBox.pointRB, itemBBox.pointLT, itemBBox.pointRT)
    const rb_line_1 = tool.calcWhichSide(roleBBox.pointRB, itemBBox.pointRT, itemBBox.pointRB)
    const rb_line_2 = tool.calcWhichSide(roleBBox.pointRB, itemBBox.pointRB, itemBBox.pointLB)
    const rb_line_3 = tool.calcWhichSide(roleBBox.pointRB, itemBBox.pointLB, itemBBox.pointLT)
    const roleRBIn = rb_line_0.ge(0).and(rb_line_1.ge(0)).and(rb_line_2.ge(0)).and(rb_line_3.ge(0))

    const lb_line_0 = tool.calcWhichSide(roleBBox.pointLB, itemBBox.pointLT, itemBBox.pointRT)
    const lb_line_1 = tool.calcWhichSide(roleBBox.pointLB, itemBBox.pointRT, itemBBox.pointRB)
    const lb_line_2 = tool.calcWhichSide(roleBBox.pointLB, itemBBox.pointRB, itemBBox.pointLB)
    const lb_line_3 = tool.calcWhichSide(roleBBox.pointLB, itemBBox.pointLB, itemBBox.pointLT)
    const roleLBIn = lb_line_0.ge(0).and(lb_line_1.ge(0)).and(lb_line_2.ge(0)).and(lb_line_3.ge(0))

    return roleLTIn.or(roleRTIn).or(roleRBIn).or(roleLBIn)
  },

  /**
   * 直線方程式, Calculate on which side of a line is a given point via linear equation
   * - point - target point3D
   * - linePointA - start point of a line
   * - linePointB - end point of a line
   */
  calcWhichSide(point: PointSignal, linePointA: PointSignal, linePointB: PointSignal) {
    // 使用直線方程式 "一般式" => Ax + By + C = 0
    // 將目標 point 帶入求得值 D, 若 D === 0 在線上, D > 0 在右側, D < 0 在左側
    // 透過 "兩點式" 反推可得 A, B, C 帶入一般式得到此 line 的直線方程式
    // D = (y2 - y1)x + (x1 - x2)y + (x2 * y1 - x1 * y2)
    return point.x
      .mul(linePointB.y.sub(linePointA.y))
      .add(point.y.mul(linePointA.x.sub(linePointB.x)))
      .add(linePointB.x.mul(linePointA.y).sub(linePointA.x.mul(linePointB.y)))
  },

  /** Collision detection via vector cross product */
  checkHit3DWithRotation2(itemBBox: BoundingBox3D, roleBBox: BoundingBox3D) {
    const lt_line_0 = tool.calcWhichSide2(roleBBox.pointLT, itemBBox.pointLT, itemBBox.pointRT)
    const lt_line_1 = tool.calcWhichSide2(roleBBox.pointLT, itemBBox.pointRT, itemBBox.pointRB)
    const lt_line_2 = tool.calcWhichSide2(roleBBox.pointLT, itemBBox.pointRB, itemBBox.pointLB)
    const lt_line_3 = tool.calcWhichSide2(roleBBox.pointLT, itemBBox.pointLB, itemBBox.pointLT)
    const roleLTIn = lt_line_0.le(0).and(lt_line_1.le(0)).and(lt_line_2.le(0)).and(lt_line_3.le(0))

    const rt_line_0 = tool.calcWhichSide2(roleBBox.pointRT, itemBBox.pointLT, itemBBox.pointRT)
    const rt_line_1 = tool.calcWhichSide2(roleBBox.pointRT, itemBBox.pointRT, itemBBox.pointRB)
    const rt_line_2 = tool.calcWhichSide2(roleBBox.pointRT, itemBBox.pointRB, itemBBox.pointLB)
    const rt_line_3 = tool.calcWhichSide2(roleBBox.pointRT, itemBBox.pointLB, itemBBox.pointLT)
    const roleRTIn = rt_line_0.le(0).and(rt_line_1.le(0)).and(rt_line_2.le(0)).and(rt_line_3.le(0))

    const rb_line_0 = tool.calcWhichSide2(roleBBox.pointRB, itemBBox.pointLT, itemBBox.pointRT)
    const rb_line_1 = tool.calcWhichSide2(roleBBox.pointRB, itemBBox.pointRT, itemBBox.pointRB)
    const rb_line_2 = tool.calcWhichSide2(roleBBox.pointRB, itemBBox.pointRB, itemBBox.pointLB)
    const rb_line_3 = tool.calcWhichSide2(roleBBox.pointRB, itemBBox.pointLB, itemBBox.pointLT)
    const roleRBIn = rb_line_0.le(0).and(rb_line_1.le(0)).and(rb_line_2.le(0)).and(rb_line_3.le(0))

    const lb_line_0 = tool.calcWhichSide2(roleBBox.pointLB, itemBBox.pointLT, itemBBox.pointRT)
    const lb_line_1 = tool.calcWhichSide2(roleBBox.pointLB, itemBBox.pointRT, itemBBox.pointRB)
    const lb_line_2 = tool.calcWhichSide2(roleBBox.pointLB, itemBBox.pointRB, itemBBox.pointLB)
    const lb_line_3 = tool.calcWhichSide2(roleBBox.pointLB, itemBBox.pointLB, itemBBox.pointLT)
    const roleLBIn = lb_line_0.le(0).and(lb_line_1.le(0)).and(lb_line_2.le(0)).and(lb_line_3.le(0))

    return roleLTIn.or(roleRTIn).or(roleRBIn).or(roleLBIn)
  },

  /** 外積, Calculate on which side of a line is a given point via vector cross product */
  calcWhichSide2(pointA: PointSignal, pointB: PointSignal, pointC: PointSignal) {
    // 向量矩陣求外積 lineAB X lineAC
    // [(xb-xa), (yb-ya)]
    // [(xc-xa), (yc-ya)]
    // D = (xb - xa)*(yc - ya) - (yb - ya)*(xc - xa)
    // 若 D === 0 在線上, D > 0 在左側, D < 0 在右側
    const vectorAB = Reactive.vector(
      pointB.x.sub(pointA.x),
      pointB.y.sub(pointA.y),
      pointB.z.sub(pointA.z), // 位在 XY 平面, z 必為 0
    )
    const vectorAC = Reactive.vector(
      pointC.x.sub(pointA.x),
      pointC.y.sub(pointA.y),
      pointC.z.sub(pointA.z), // 位在 XY 平面, z 必為 0
    )

    // 外積求到的是法線向量, 由於計算用的兩向量為 z = 0 之平面, 故此法線必為 (0, 0, z)
    // 取得 z 可得外積的純量, 也就是 D
    return vectorAB.cross(vectorAC).z
  },

  /** Convert degrees to radians. */
  toRadians(degrees: number | ScalarSignal) {
    if (typeof degrees === 'number') {
      return degrees * (Math.PI / 180)
    } else {
      return degrees.mul(Math.PI / 180)
    }
  },

  /** Convert radians to degrees. */
  toDegrees(radians: number | ScalarSignal) {
    if (typeof radians === 'number') {
      return 180 * (radians / Math.PI)
    } else {
      return radians.div(Math.PI).mul(180)
    }
  },
}