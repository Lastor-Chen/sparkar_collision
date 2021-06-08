interface BoundingBox3D {
  pivot: PointSignal,
  pointLT: PointSignal,
  pointLB: PointSignal,
  pointRT: PointSignal,
  pointRB: PointSignal,
  left: ScalarSignal,
  top: ScalarSignal,
  right: ScalarSignal,
  bottom: ScalarSignal,
  halfSizeX?: ScalarSignal,
  halfSizeY?: ScalarSignal,
}

// GJK
interface Trapezium extends ThreeDObject {
  pivot: PointSignal,
  vertices: PointSignal[],
}
