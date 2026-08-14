<div align="center">

<img src="./apps/www/app/logo.svg" alt="" width="88" height="88">

# Liqui Design

**基于 [Base UI](https://base-ui.com) 的 React 液态玻璃组件库。**

表面是真的会折射背后的内容 —— 用 canvas 生成置换贴图（displacement map）驱动 SVG 滤镜，
而不是一层模糊加一块白色蒙版。

[English](./README.md) · 简体中文

[文档](https://liqui.design) · [玻璃手册](https://liqui.design/docs/handbook/glass) · [组件](https://liqui.design/docs/components/button) · [图库](https://liquidglassdesign.com/?ref=liqui.design)

[![npm](https://img.shields.io/npm/v/@liqui-design/glass?color=%232f6bff&label=%40liqui-design%2Fglass)](https://www.npmjs.com/package/@liqui-design/glass)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

</div>

---

> 站点文档目前只有英文版。这份 README 是中文入口，随英文版一起维护。

## 关于名字

项目的正式名称是 **Liqui Design**。在正文和命令行里就写作 liqui —— 包名是
`@liqui-design/glass`，文档域名是 liqui.design，没人会去敲那两个大写字母。

## 它从哪来

Liqui Design 源自 [Liquid Glass Design](https://liquidglassdesign.com/?ref=liqui.design)，
一个收录液态玻璃与毛玻璃设计参考的策展图库。它是另一个独立的站点，也是这两个名字听起来
相近的原因。图库里的每一份参考都是一张图片 —— 足够你研究这种材质，却远不足以让你把它做出来，
因为真正让它成为「玻璃」的，是边缘对背后内容做了什么，而这一点截图里根本没有。图库留下参考，
这里是你可以直接装进项目的另一半。

## 如何交付

组件是**你项目里的源码**，通过 shadcn CLI 安装。文件归你所有，你可以随便改。只有折射内核
—— 置换贴图的数学计算、全文档范围的 SVG 滤镜注册表，以及浏览器兜底方案 —— 保持为依赖，
因为这些部分你没法靠手工合理地维护。

```bash
npx shadcn@latest add https://liqui.design/r/button.json
```

这一条命令就是全部安装步骤：它会写入 `components/ui/button.tsx`，把玻璃设计令牌加进你的
`globals.css`，并安装内核。

要装多个组件？在 `components.json` 里把命名空间注册一次，之后就不用再写完整 URL：

```json
{
  "registries": {
    "@liqui-design": "https://liqui.design/r/{name}.json"
  }
}
```

```bash
npx shadcn@latest add @liqui-design/button
```

> `@liqui-design/button` 是一个 registry 条目，不是 npm 包 —— 这个命名空间是你自己
> `components.json` 里的一个键，由 shadcn CLI 负责解析。唯一真正来自 npm 的是
> [`@liqui-design/glass`](https://www.npmjs.com/package/@liqui-design/glass)，
> 而它由 CLI 自动帮你安装。

liqui 和 shadcn/ui 建立在同一套 Base UI 基础上（`shadcn init -b base`），所以你已有的
`components.json`、`cn()` 和 Tailwind 令牌配置可以原样沿用。

## 用起来

```tsx
import { Button } from '@/components/ui/button';

export default function Page() {
  return (
    <main className="min-h-dvh bg-[url(/wallpaper.jpg)] bg-cover p-10">
      <Button variant="accent">Continue</Button>
    </main>
  );
}
```

注意那个背景。**玻璃折射的是它背后的东西**，所以放在纯色填充上的表面没有任何可折射的内容，
看起来就只是一个稍微发灰的方块。把它放在图片、视频、有真实边界的渐变，或者会从下方滚过的
内容之上。

## 组件

| | |
| --- | --- |
| [Accordion](https://liqui.design/docs/components/accordion) | 每一项都是独立的表面，随面板一起改变尺寸 |
| [Alert Dialog](https://liqui.design/docs/components/alert-dialog) | 模态且不可随手关闭，折射一层压暗的遮罩 |
| [Button](https://liqui.design/docs/components/button) | 提供玻璃、强调色和危险色三种着色 |
| [Checkbox](https://liqui.design/docs/components/checkbox) | 以强调色填充，同时保留斜面和高光边缘 |
| [Context Menu](https://liqui.design/docs/components/context-menu) | 支持子菜单、复选与单选项，弹层可保持挂载 |
| [Dialog](https://liqui.design/docs/components/dialog) | 可关闭的那一个；角上的关闭按钮保持扁平 |
| [Field](https://liqui.design/docs/components/field) | 聚焦环和错误环画在表面上，而不是 input 上 |
| [Popover](https://liqui.design/docs/components/popover) | 带指示尾巴的玻璃面板，内部承载扁平化的控件 |
| [Select](https://liqui.design/docs/components/select) | 玻璃触发器配玻璃弹层，并避免两者重叠 |
| [Slider](https://liqui.design/docs/components/slider) | 滑块就是那枚透镜；轨道刻意保持扁平 |
| [Switch](https://liqui.design/docs/components/switch) | 轨道是透镜；滑块刻意保持不透明 |
| [Tooltip](https://liqui.design/docs/components/tooltip) | 最小的表面，磨砂程度更高以保证可读性 |

## 浏览器支持

| | 折射 | 说明 |
| --- | :---: | --- |
| Chromium | ✅ | 完整的置换折射 |
| Safari | — | 一旦 `backdrop-filter` 引用了 SVG 滤镜就会被整个丢弃。WebKit bug [245510](https://bugs.webkit.org/show_bug.cgi?id=245510) 的实现正在评审中 |
| Firefox | — | 同上 |

降级到磨砂模糊是自动的，无需任何配置，但仍然值得亲自看一眼：一套按 `frost: 0` 调好的设计，
在透镜消失之后可能会变得难以阅读 —— 因为在折射档位里，透镜承担了本该由着色去做的工作。
参见[玻璃手册](https://liqui.design/docs/handbook/glass#degradation)。

## 环境要求

- React 18 或 19
- Tailwind CSS v4

## 仓库结构

```
packages/glass    @liqui-design/glass —— 折射内核
apps/www          文档站点，以及 CLI 安装时读取的 registry
apps/playground   Vite 应用，用于对着真实背景调试光学参数
```

本地运行或新增组件，见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 许可

[MIT](./LICENSE)
