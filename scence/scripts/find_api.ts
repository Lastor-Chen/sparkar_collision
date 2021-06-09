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
    Scene.root.findFirst('leftRight_plane'),
    Scene.root.findFirst('leftRight_trapezium'),
    Scene.root.findByPath('**/leftRight/leftRight_trapezium/rect0/vertex*'),
    Scene.root.findByPath('**/multiLines/*/*/vertex*'),
    Scene.root.findFirst('circle'),
    Scene.root.findFirst('circleS'),
    Scene.root.findFirst('gjk_plane'),
    Scene.root.findFirst('trapezium'),
    Scene.root.findByPath('**/GJK/trapezium/rect0/vertex*'),
    Materials.findFirst('circle'),
    Materials.findFirst('collider'),
  ])

  // rename assets
  const names = [
    'user',
    'userCircle',
    'AABB_plane',
    'leftRight_plane',
    'leftRight_trapezium',
    'leftRight_vertices',
    'multiLines_vertices',
    'circle',
    'circleS',
    'gjk_plane',
    'gjk_trapezium',
    'gjk_vertices',
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