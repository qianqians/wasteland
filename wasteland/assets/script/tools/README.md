# cccTools
cocos creator tools

## UIManager controller

页面 prefab 不需要挂载业务脚本。业务逻辑写成普通 TypeScript 类，并在首包入口静态 import 后注册到 UIManager。

```ts
import { Node, find, Button } from 'cc';
import { IUIController, UIManager } from './tools/UIManager/UIManager';

class HomePageController implements IUIController {
    private root:Node|null = null;
    private startBtn:Button|null = null;

    public OnOpen(root:Node, data?:unknown) {
        this.root = root;
        this.startBtn = find('StartBtn', root)?.getComponent(Button) ?? null;
        this.startBtn?.node.on(Button.EventType.CLICK, this.OnStartClick, this);
    }

    public OnClose() {
        this.startBtn?.node.off(Button.EventType.CLICK, this.OnStartClick, this);
        this.startBtn = null;
        this.root = null;
    }

    private OnStartClick() {
        console.log('start');
    }
}

UIManager.Instance.RegisterPageController('HomePage', () => new HomePageController());

// 先加载资源，再同步展示
const prefab = await UIManager.Instance.LoadPage('HomePage', 'main');
UIManager.Instance.ShowPage('HomePage', prefab, { title: 'home' });
```

通过静态 import 注册的 controller 会进入首包代码；prefab、图片、音频等资源继续放在 bundle 中按需加载。页面展示采用 LoadPage + ShowPage 分离模式：LoadPage 异步加载资源返回 Prefab，ShowPage 同步创建展示页面，避免异步回调中页面在不适当场景弹出。
