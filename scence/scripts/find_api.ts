import Scene from 'Scene'
import Materials from 'Materials'
import Textures from 'Textures'

/** Return a renamed asset Object. */
export async function queryAsset() {
  // @ts-ignore
  const assets = await Promise.all([
    Scene.root.findFirst('user'),
    Scene.root.findFirst('userCircle'),
    Scene.root.findFirst('AABB_plane'),
    Scene.root.findFirst('pInR_plane'),
    Scene.root.findFirst('leftRight_plane'),
    Scene.root.findFirst('leftRight_trapezium'),
    Scene.root.findFirst('multiLines_u_mesh'),
    Scene.root.findFirst('circle'),
    Scene.root.findFirst('circleS'),
    Scene.root.findFirst('gjk_trapezium'),
    Scene.root.findByPath('**/GJK/gjk_trapezium/rect0/vertex*'),
    Scene.root.findFirst('gjk_status'),
    Scene.root.findFirst('n_poly'),
    Materials.findFirst('circle'),
    Materials.findFirst('collider'),
  ])

  // rename assets
  const names = [
    'user',
    'userCircle',
    'AABB_plane',
    'pInR_plane',
    'leftRight_plane',
    'leftRight_trapezium',
    'multiLines_u_mesh',
    'circle',
    'circleS',
    'gjk_trapezium',
    'gjk_vertices',
    'gjk_status',
    'n_poly',
    'circleMat',
    'colliderMat',
  ]

  // build asset Object
  const asset = {}
  names.forEach((key, index) => {
    asset[key] = assets[index]
  })

  return asset
}