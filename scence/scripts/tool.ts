import Reactive from 'Reactive'

export const tool = {
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