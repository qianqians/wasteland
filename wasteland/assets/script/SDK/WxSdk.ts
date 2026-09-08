import { _decorator, Component, math, Node, Rect, sys } from 'cc';
import { SdkInterface, Sysinfo, UserPlatformInfo, replaceName } from './SdkInterface';

export default class WxSdk implements SdkInterface
{   
    private video:any;
    private callback:any;
    private target:any;
    private banner:any;
    private interstitial:any;
    private costom:any;

    public nick_name:string;
    //public avatar_url:string;

    private wxUserInfo(_callBack:(code:string) => void, _code:string) 
    {

        let wxSize = wx.getWindowInfo();
        let btn = wx.createUserInfoButton({
            type: 'text',
            text: '进入游戏',
            style: {
                left: wxSize.screenWidth / 2 - 100,
                top: wxSize.screenHeight / 2 + 60,
                width: 200,
                height: 40,
                lineHeight: 40,
                backgroundColor: '#ffffff',
                borderColor: '#ffffff',
                borderWidth: 1,
                color: '#000000',
                textAlign: 'center',
                fontSize: 16,
                borderRadius: 4
            }
        });

        btn.onTap((res) => {
            console.log("createUserInfoButton:" + JSON.stringify(res));
            this.get_user_info_login(_callBack, _code)
            btn.destroy();
        });
    }

    private get_user_info_login(_callBack: (code: string) => void, _code: string)
    {
        wx.getSetting({
            success: (res) => {
                if (res.authSetting['scope.userInfo']) {
                    wx.getUserInfo({
                        withCredentials: false,
                        success: async (result) =>
                        { 
                            await _callBack(_code);
                            this.nick_name = replaceName(result.userInfo.nickName).slice(0, 5);
                        },
                        fail: (res) =>
                        {
                            console.log("fail:" + JSON.stringify(res));
                        },
                        complete: (res) =>
                        {
                            console.log("complete:" + JSON.stringify(res));
                        }
                    });
                } else {
                    this.wxUserInfo(_callBack, _code);
                }
            }
        });
    }

    init()
    {
        wx.onNeedPrivacyAuthorization((resolve:any) =>
        {
            console.log("privacy authorization:",);

            wx.showModal({
                title: '隐私保护',
                content: '为了提供游戏服务，需要获取你的微信昵称等信息，请阅读并同意隐私保护指引。',
                confirmText: '同意',
                cancelText: '拒绝',

                success: (res) =>
                {
                    if (res.confirm)
                    {
                        console.log("privacy agree");
                        resolve({event: 'agree'});
                    }
                    else
                    {
                        console.log("privacy disagree");
                        resolve({event: 'disagree'});
                    }
                }
            });
        });

        wx.showShareMenu({
            withShareTicket:true ,
            menus:["shareAppMessage" , "shareTimeline"]
        });
        wx.onShareAppMessage(
            () => {
                return {
                    title: '幻世驱魔录',
                    imageUrl: '',
                };
            }
        );
        wx.onShareTimeline(() => {
            return {
                title: '快来一起玩幻世驱魔录！', // 自定义分享标题
                imageUrl: '',
            };
        });
    }
    
    /**
     * 微信登录
     * @param _callBack 登录成功后的回调
     * @param _target 监听对象
     */
    login(_callBack:(code:string) => void)
    {
        this.init();
        wx.login({
            complete: (res) =>
            {
                console.log("login complete:" + JSON.stringify(res));
            },
            fail: (res) =>
            {
                console.log("login fail:" + JSON.stringify(res));
            },
            success: (login_res) =>
            {
                console.log("login success:" + JSON.stringify(login_res));
                this.get_user_info_login(_callBack, login_res.code);
            }
        });
    }

    /**
     * 登出
     */
    logout(): void
    {
        
    }

    /**
     * 退出
     */
    exit(): void
    {
        
    }

    /**
     * 切换账号
     */
    switchLogin(): void
    {
        
    }

    /**
     * 上报数据
     * @param _param 参数
     */
    report(..._param: any[]): void
    {
        
    }

    /**
     * 支付
     * @param _param 参数
     */
    pay(..._param: any): void
    {
        
    }

    
    /**
     * 获取系统信息
     * @returns 系统信息
     */
    getSystemInfo()
    {
        let sysInfo:Sysinfo = new Sysinfo();
        //屏幕安全区域
        sysInfo.safeArea.bottom = wx.getWindowInfo().safeArea.bottom;
        sysInfo.safeArea.top = wx.getWindowInfo().safeArea.top;
        sysInfo.safeArea.left = wx.getWindowInfo().safeArea.left;
        sysInfo.safeArea.right = wx.getWindowInfo().safeArea.right;
        sysInfo.safeArea.height = wx.getWindowInfo().safeArea.height;
        sysInfo.safeArea.width = wx.getWindowInfo().safeArea.width;
        //屏幕高宽
        sysInfo.screenHeight = wx.getWindowInfo().screenHeight;
        sysInfo.screenWidth = wx.getWindowInfo().screenWidth;
        //系统平台
        sysInfo.platform=wx.getDeviceInfo().platform;
        //菜单按钮大小位置
        sysInfo.menuBtn.bottom=wx.getMenuButtonBoundingClientRect().bottom;
        sysInfo.menuBtn.height=wx.getMenuButtonBoundingClientRect().height;
        sysInfo.menuBtn.left=wx.getMenuButtonBoundingClientRect().left;
        sysInfo.menuBtn.right=wx.getMenuButtonBoundingClientRect().right;
        sysInfo.menuBtn.top=wx.getMenuButtonBoundingClientRect().top;
        sysInfo.menuBtn.width=wx.getMenuButtonBoundingClientRect().width;

        return sysInfo;
    }

    getUserInfo()
    {
        let userInfo:UserPlatformInfo = new UserPlatformInfo();
        userInfo.nickName=this.nick_name;
        //userInfo.avatarUrl=this.avatar_url;
        return userInfo;
    }
}

