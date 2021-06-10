interface getBBox3dConfig {
  /** 放入父物件, 則併入計算父物件之 position, scale */
  parent?: SceneObjectBase,
  /** 計算旋轉, 預設 false */
  useRotation?: boolean,
}

interface BoundingBox3D {
  pivot: PointSignal,
  /** 點位順時針, 左下開始 */
  vertices: PointSignal[],
  left: ScalarSignal,
  top: ScalarSignal,
  right: ScalarSignal,
  bottom: ScalarSignal,
  sizeX: ScalarSignal,
  sizeY: ScalarSignal,
}

// GJK
interface Trapezium extends ThreeDObject {
  pivot?: PointSignal,
  vertices?: PointSignal[],
}
