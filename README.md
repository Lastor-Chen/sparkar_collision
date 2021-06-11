# SparkAR 2D Collision Detection Demo in v114
使用 SparkAR 響應式 API 實作 2D 碰撞偵測

### module list
`index.ts` 為進入點, `index.d.ts` 為 TS 型別定義檔

- 矩形碰撞
  - AABB 對稱軸包圍盒(不可旋轉): `aabb.ts`
  - 點包含法: `point_in_rect.ts`
- 凸多邊形碰撞
  - 左右側法: `left_right.ts`
  - 多線段左右側: `multi_lines.ts`
  - SAT 分離軸定律: `sat.ts`
  - GJK 演算法: `gjk.ts`
- 圓形碰撞
  - 圓對矩形: `circle.ts`
  - 圓對圓形: `circle.ts`

## How to use
1. 下載後使用 [SparkAR](https://sparkar.facebook.com/ar-studio/learn/downloads/) v114 以上版本開啟
2. 於 `index.ts` 將想要的模塊 uncomment
3. 於 sparkAR 將相同模塊的 group 開啟 visible
4. 直接於畫面上位移 user(紅色方塊) 進行碰撞操作
5. 部分模塊有做矩形自動旋轉的 Patches, 方便檢測, 可自由開關

## 原理簡要說明
各算法之 ts 檔中, 亦有簡易說明

### AABB 對稱軸包圍盒
假設1維空間上有一條直線與一點, 點與直線發生碰撞, 意即點位於直線範圍內。<br>
```
if (line.left < point.x && point.x < line.right)
  碰撞發生
```

將此概念拓展到2維矩形上, 且矩形有對稱性, 僅需檢查 x, y 方向上的線是否交疊即可
```
// x 軸為例
if (rectA.right > rectB.left && rectB.right > rectA.left)
  x 方向發生碰撞
```

優缺點:
- 僅能矩形對矩形, 且不可旋轉
- 效能最高

### 點包含法
逐個判斷矩形上的 point，是否位於另一個矩形中。<br>
假設 rect 上有點 A, B, C, D，要判斷 P 點是否位於矩形中，可利用向量內積處理。
```
if (0 ≤ AP·AB ≤ AB·AB) && (0 ≤ AP·AD ≤ AD·AD)
  點 P 在矩形內
```

優缺點:
- 不限矩形, 可適用於平行四邊形
- 其對各點皆做判斷，因此適用於旋轉的矩形
- 運算量比 AABB 大些

### 左右側法
利用向量外積原理，可判斷 point 在向量的左側 or 右側。<br>
將矩形的 edge 以順時針方向做出向量，可得出 point 是否位於該範圍內。
```
// 假設有一向量 AB, 與一點 C
const cross = vecAB.cross(vecAC).magnitude() // 取幅長
if cross > 0, 點在左側
if cross < 0, 點在右側
if cross === 0, 點在線上
```

優缺點:
- 可處理凸四邊形 (非平行四邊形也可)
- 理論上可處理凸多邊形 (沒有測)
- 線越多運算量越大
- 體感上效能跟「點包含法」差不多, 適用面高

### 多線段左右側
左右側法的延伸, 假設遊戲 map 為一條道路, 判斷 role 是否出界。<br>
不推薦, 不如直接拆分成多矩形實用。

### SAT 分離軸定律 (Separating Axis Theorem)
如果兩個 shape 未碰撞(未相交), 則必能畫出一條線(分離線)分隔出兩者。<br>
只要能找到一條分離線，即表示未發生碰撞。<br>

詳細可參考, [連結](https://davidhsu666.com/archives/gamecollisiondetection/)

優缺點:
- 可處理所有類型凸多邊形碰撞
- 相較簡單的矩形碰撞偵測, 運算量勢必比較大
- 可適用於 sparkAR 響應式 API
- 由於算法特性, 使用 setInterval 效能或許會更好 (待測試)
- 可取得碰撞深度
- 被許多遊戲引擎採用

### GJK 演算法
數學上幾何圖形可與另一圖形進行加減法, 進而得出另一個圖形。<br>
GJK 是利用兩 shape 交疊時, 圖形相減後的新圖形, 必定包含原點的特性來判斷碰撞。<br>

詳細可參考, [連結](https://bwaynesu.wordpress.com/2018/09/10/gjk-collision-detection/?fbclid=IwAR3YCVEgsuRLhdYKgg3n2WUBfaKvZL2rXZuvFpHD4gJhaf4xOUOKJZcdphY)

優缺點:
- 可處理所有類型凸多邊形碰撞
- 可取得碰撞深度
- 被許多遊戲引擎採用
- GJK 會一直做遍歷動作, 運算成本對 sparkAR 過高, 會當掉
- 無法適用於 sparkAR 響應式 API (我目前寫不出來)

### 圓形碰撞
計算矩形各 point 與圓心的距離, 如有一個小於半徑, 則發生碰撞。<br>
另, 兩圓偵測, 僅需計算兩圓心距離, 是否小於兩者半徑相加。<br>

Scene 說明:<br>
假設遊戲 map 為圓形軌道, 使用兩正方形當作圓使用, 分別作為外圈與內圈。<br>
role 需介於內外圈之間, 超出範圍表示出界。<br>

優缺點:
- 僅適用於正圓
- 目前算法無法判斷矩形相切於圓的情況