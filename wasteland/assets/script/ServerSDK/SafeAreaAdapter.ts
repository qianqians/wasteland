import { _decorator, Component, Widget, view, screen, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SafeAreaAdapter')
export class SafeAreaAdapter extends Component {
    public adaptLeft: boolean = true;
    public adaptRight: boolean = false;
    public adaptTop: boolean = false;
    public adaptBottom: boolean = false;
    public sidePadding: number = 10;

    private _resizeCallback: any = null;

    start() {
        this.applySafeArea();
        this.registerOrientationListener();
    }

    onEnable() {
        this.applySafeArea();
    }

    onDisable() {
        this.unregisterOrientationListener();
    }

    /**
     * 注册旋转/窗口大小改变监听
     */
    private registerOrientationListener() {
        if (sys.platform === sys.Platform.WECHAT_GAME) {
            if (wx.onWindowResize) {
                this._resizeCallback = (res: any) => {
                    console.log("[SafeAreaAdapter] 收到手机旋转/窗口尺寸变化事件，重新计算安全区...");
                    // 延迟一帧等待微信 API 更新 safeArea 数据
                    this.scheduleOnce(() => {
                        this.applySafeArea();
                    }, 0.05);
                };
                wx.onWindowResize(this._resizeCallback);
            }
        }
    }

    /**
     * 注销监听
     */
    private unregisterOrientationListener() {
        if (sys.platform === sys.Platform.WECHAT_GAME) {
            const wx = (window as any).wx;
            if (wx && wx.offWindowResize && this._resizeCallback) {
                wx.offWindowResize(this._resizeCallback);
                this._resizeCallback = null;
            }
        }
    }

    /**
     * 核心计算与适配逻辑
     */
    public applySafeArea() {
        if (sys.platform !== sys.Platform.WECHAT_GAME) return;

        // 统一获取最新的窗口信息
        const sysInfo = wx.getWindowInfo();
        if (!sysInfo) return;

        const safeArea = sysInfo.safeArea;
        const menuButton = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;

        const screenWidth = sysInfo.screenWidth || sysInfo.windowWidth || 844;
        const screenHeight = sysInfo.screenHeight || sysInfo.windowHeight || 390;

        const visibleSize = view.getVisibleSize();

        // 逻辑像素转换到 Cocos UI 视口比例
        const scaleX = visibleSize.width / screenWidth;
        const scaleY = visibleSize.height / screenHeight;

        let widget = this.getComponent(Widget);
        if (!widget) {
            widget = this.addComponent(Widget);
        }

        // 显式重置标志位，防止互顶和拉伸
        widget.isAlignLeft = false;
        widget.isAlignRight = false;
        widget.isAlignTop = false;
        widget.isAlignBottom = false;

        // ================= 1. 左侧避让（计算刘海 + 胶囊位于左侧的情况） =================
        if (this.adaptLeft) {
            let rawLeftDistance = 0;

            // 1.1 系统安全区左边界（刘海在左侧）
            if (safeArea && safeArea.left > 0) {
                rawLeftDistance = safeArea.left;
            }

            // 1.2 旋转后如果微信胶囊转到了左侧 (menuButton.left < screenWidth / 2)
            if (menuButton && menuButton.left < screenWidth / 2) {
                const menuRightDist = menuButton.right; // 胶囊右边界到屏幕左侧的距离
                rawLeftDistance = Math.max(rawLeftDistance, menuRightDist);
            }

            // 1.3 模拟器/部分机型保底距离 (低于 30 时给予 47px 刘海保底)
            //if (rawLeftDistance < 30) {
            //    rawLeftDistance = 47;
            //}

            widget.isAlignLeft = true;
            widget.left = (rawLeftDistance * scaleX) + this.sidePadding;
        }

        // ================= 2. 右侧避让（计算刘海 + 胶囊位于右侧的情况） =================
        if (this.adaptRight) {
            let rawRightDistance = 0;

            // 2.1 系统安全区右边界（刘海在右侧）
            if (safeArea && safeArea.right < screenWidth) {
                rawRightDistance = screenWidth - safeArea.right;
            }

            // 2.2 胶囊在右侧 (menuButton.left >= screenWidth / 2)
            if (menuButton && menuButton.left >= screenWidth / 2) {
                const menuLeftDist = screenWidth - menuButton.left;
                rawRightDistance = Math.max(rawRightDistance, menuLeftDist);
            }

            // 2.3 保底距离
            if (rawRightDistance < 30) {
                rawRightDistance = 47;
            }

            widget.isAlignRight = true;
            widget.right = (rawRightDistance * scaleX) + this.sidePadding;
        }

        // ================= 3. 顶部避让 =================
        if (this.adaptTop && menuButton) {
            widget.isAlignTop = true;
            widget.top = (menuButton.bottom * scaleY) + 10;
        }

        // ================= 4. 底部避让 =================
        if (this.adaptBottom && safeArea) {
            const rawBottomDistance = screenHeight - safeArea.bottom;
            widget.isAlignBottom = true;
            widget.bottom = (rawBottomDistance * scaleY);
        }

        // 刷新 Widget 对齐组件
        widget.updateAlignment();
    }
}