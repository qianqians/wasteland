import { _decorator, Component, Widget, view, screen, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SafeAreaAdapter')
export class SafeAreaAdapter extends Component {
    public adaptLeft: boolean = true;
    public adaptRight: boolean = true;
    public adaptTop: boolean = true;
    public adaptBottom: boolean = true;
    public sidePadding: number = 20;

    start() {
        this.applySafeArea();
    }

    public applySafeArea() {
        console.log("SafeAreaAdapter: Applying safe area adaptation...");

        // 仅在微信小游戏或原生支持安全区的平台上执行
        if (sys.platform !== sys.Platform.WECHAT_GAME) {
            console.log("SafeAreaAdapter: Not running on WeChat Mini Game platform, skipping safe area adaptation.");
            return;
        }

        const sysInfo = wx.getWindowInfo();
        const safeArea = sysInfo.safeArea;
        const menuButton = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;

        // 计算物理/逻辑视口到 Cocos 视图像素的缩放比
        const frameSize = screen.windowSize; 
        const visibleSize = view.getVisibleSize();
        
        // 横屏通常采用 Fit Height 策略，比例取高度或综合比
        const scaleX = visibleSize.width / frameSize.width;
        const scaleY = visibleSize.height / frameSize.height;

        let widget = this.getComponent(Widget);
        if (!widget) {
            widget = this.addComponent(Widget);
            console.log("SafeAreaAdapter: Widget component added for safe area adaptation.");
        }

        // 1. 左侧安全区避让（横屏刘海在左侧时）
        if (this.adaptLeft && safeArea) {
            const rawLeft = safeArea.left;
            widget.isAlignLeft = true;
            widget.left = (rawLeft * scaleX) + this.sidePadding;
        }

        // 2. 右侧安全区与微信胶囊避让（横屏刘海在右侧，或者避让右上角胶囊）
        if (this.adaptRight) {
            let rawRightDistance = 0;
            if (safeArea) {
                rawRightDistance = frameSize.width - safeArea.right;
            }

            // 如果右上角有胶囊，胶囊距离右屏幕边缘为：frameSize.width - menuButton.left
            if (menuButton) {
                const menuRightDistance = frameSize.width - menuButton.left;
                rawRightDistance = Math.max(rawRightDistance, menuRightDistance);
            }

            widget.isAlignRight = true;
            widget.right = (rawRightDistance * scaleX) + this.sidePadding;
        }

        // 3. 顶部避让（如有需要避开胶囊下边缘）
        if (this.adaptTop && menuButton) {
            widget.isAlignTop = true;
            widget.top = (menuButton.bottom * scaleY);
        }

        // 4. 底部手势横条避让
        if (this.adaptBottom && safeArea) {
            const rawBottomDistance = frameSize.height - safeArea.bottom;
            widget.isAlignBottom = true;
            widget.bottom = (rawBottomDistance * scaleY);
        }

        // 刷新组件对齐生效
        widget.updateAlignment();

        console.log("SafeAreaAdapter: Applied safe area adaptation with settings:", {
            adaptLeft: this.adaptLeft,
            adaptRight: this.adaptRight,
            adaptTop: this.adaptTop,
            adaptBottom: this.adaptBottom,
            sidePadding: this.sidePadding,
            safeArea: safeArea,
            menuButton: menuButton
        });
    }
}