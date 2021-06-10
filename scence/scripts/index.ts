/// <reference path="index.d.ts" />
import { queryAsset } from './find_api'
import { runAABB } from './aabb'
import { runPointInRect } from './point_in_rect'
import { runLeftRight } from './left_right'
import { runMultiLines } from './multi_lines'
import { runCircle } from './circle'
import { runGJK } from './gjk'

(async function () {
  const asset = await queryAsset()

  // 矩形碰撞 (無旋轉), 軸對稱包圍盒 (Axis-Aligned Bounding Box)
  // runAABB(asset)

  // 矩形碰撞 (可旋轉), 點包含法
  runPointInRect(asset)

  // 凸四邊形碰撞 (可旋轉), 左右側判定法
  // runLeftRight(asset)

  // 直線式道路, 左右側法之連續線段判定
  // runMultiLines(asset)

  // 圓形-圓形 or 圓形-矩形, 半徑法
  // runCircle(asset)

  // 凸多邊形, GJK 演算法, 運算成本過高, 會當掉
  // runGJK(asset)
})();
