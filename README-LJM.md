# 项目架构与核心逻辑说明

> 本文基于 `Super-Mario-Phaser` 现有源码（2025-07 修订版）整理，旨在帮助二次开发者快速理解整体结构、关键变量及可扩展点。

## 一、整体技术栈
1. **Phaser 3.55.2**：核心渲染与物理引擎。
2. **Phaser Rex Plugins**：
   - `rexvirtualjoystickplugin` – 移动端摇杆控制。
   - `rexcheckboxplugin` – 设置界面开关。
   - `rexsliderplugin` – 音量滑块。
   - `rexkawaseblurpipelineplugin` – 后期模糊管线（当前未启用，可自行挂载）。
3. 资源组织：所有素材均置于 `assets/` 子目录，按功能再细分（blocks、collectibles、entities 等）。
4. 入口：
   - `index.html` 加载 Phaser 与所有脚本。
   - **主场景脚本** `javascript/game.js` 内部实现 `preload / create / update` 三阶段。
   - 其余脚本通过模块化方式（非 ESM）补充功能，彼此之间依赖全局变量。

## 二、核心流程
### 1. 地图风格随机
```js
isLevelOverworld = Phaser.Math.Between(0, 100) <= 84; // 84% 地面关，16% 地下关
```
- **影响点**
  1. 贴图加载路径（overworld/underground）。
  2. 天空背景颜色、云朵/山/灌木等装饰。
  3. BGM 切换：overworld vs underground。

### 2. 关卡生成
`generateLevel()` 依据以下参数动态拼装：
- `platformPiecesWidth`：单段地面宽度。
- `platformPieces`：整图由多少段构成。
- **空洞 (hole)** 生成：10% 概率，但会检测前一段是否已为空、防止连续空洞。
- **结构物** (`generateStructure`)：每 2~3 段尝试生成管道、砖块塔等，靠 `lastWasStructure` 标记防止过于密集。
- 空洞坐标存入 `worldHolesCoords`，供后期随机投放实体时避让。

### 3. 玩家 & 状态机
| 变量          | 取值 | 含义 |
| -------------- | ---- | ---- |
| `playerState` | 0 | 小玛里奥 |
|                | 1 | 长大（Super Mushroom） |
|                | 2 | 火球（Fire Flower） |

- **升级**：
  - `consumeMushroom` → `playerState = max(1, playerState)`
  - `consumeFireflower` → `playerState = 2`
- **受伤**：`decreasePlayerState()` 先降级，再播放无敌闪烁；若已是 0 再受伤则 `gameOver`。
- **无敌**：`applyPlayerInvulnerability(time)` 利用 tween 闪烁并屏蔽伤害。

> ⚠️ 当前代码未实现传统意义上的「生命数（Lives）」，可在 `game.js` 全局新增 `lives = 3` 并在 `gameOverFunc` 中扣减 & 重开场景实现。

### 4. 砖块与隐藏物品
文件 `blocks.js → revealHiddenBlock`：
```js
let random = Phaser.Math.Between(0, 100);
if (random < 90)          // 90% 金币
else if (random < 96)     // 6% 长大蘑菇
else                      // 4% 火花
```
- 触发条件：玩家从下顶到砖块且未被标记为空。
- 金币动画向上浮动后销毁；蘑菇会在顶起后水平移动；火花原地待命。

### 5. 控制方式
- **键盘**：默认 WASD+Space+Q，可通过设置界面重新绑定，键码存 `localStorage`。
- **移动端**：`rexvirtualjoystickplugin` 生成圆形摇杆，坐标位于屏幕 1/6 处 (`createControls`)；当插件加载失败则降级为纯键盘模式（已在最新补丁中加入容错）。

### 6. HUD 与设置
脚本 `hud-control.js` 负责计分板、计时器等；`settings.js` 绘制暂停菜单：
- 音乐/音效开关 → `rexcheckboxplugin`。
- 总音量 → `rexsliderplugin`，值实时写入 `localStorage` 并同步到 `this.sound.volume`。
- 键位修改 → 监听 `keydown` 动态替换 `controlKeys`。

## 三、二次开发建议
1. **生命系统**
   - 全局 `lives` 变量 + HUD hearts；在死亡后判断是否重生或直接 `gameOver`。
2. **多地图/关卡选择**
   - 把 `generateLevel()` 抽象为根据 JSON 参数绘制；菜单场景可让玩家挑选 World-1-1 / 1-2 等。
3. **敌人 AI 扩展**
   - 目前只有 `goomba`、`koopa`（部分），可添加 `piranha`、`bullet bill` 等，新建 `entities-control.js` 分模块管理。
4. **道具种类**
   - 在 `revealHiddenBlock` 的随机表中插入星星 (Star) 或 1-UP 蘑菇；额外实现对应效果。
5. **特效管线**
   - 已加载 `rexkawaseblurpipelineplugin`，可在中毒/暂停时给摄像机叠加 KawaseBlur。
6. **存档机制**
   - 将分数、关卡、生命等写入 `localStorage` 或后端 API，实现断点续玩。

## 更新记录
- 2025-07-05：默认初始形态由「小马里奥」改为 **火球马里奥**（`playerState = 2`），并在 `createPlayer()` 内按形态动态选择贴图与碰撞盒尺寸。

---
©2025  Super-Mario-Phaser 改编文档，可自由转载与修改。
