import { _decorator, Component, Node, CCInteger, director, sys, native, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;
import * as engine from './engine/engine'
import * as login from './engine/login_cli'
import { LoginCallback } from '../Login/LoginCallback'
import { BundleManager } from '../tools/BundleManager/BundleManager';
import { SdkInterface, SetPlatform } from '../SDK/SdkInterface';

class ClientEventHandle extends engine.client_event_handle {
    public on_kick_off(prompt_info:string) {
        console.log(prompt_info);
    }

    public on_transfer_complete() {
        console.log("on_transfer_complete");
    }
}

class WSChannel extends engine.channel {
    private client: WebSocket | null;

    public constructor() {
        super();
        this.client = null;
    }

    public connect(wsHost:string) : boolean {
        console.log("WSChannel connect begin! wsHost:", wsHost);
        this.client = new WebSocket(wsHost);
        this.client.onopen = (evt) => {
            console.log("WSChannel connect complete! msg:", evt.type);
        }
        this.client.onclose = (evt) => {
            console.log("WSChannel onclose! msg:", evt.type);
        };
        this.client.onerror = (evt) => {
            console.log("WSChannel onerror! msg:", evt.type);
        };
        console.log("WSChannel connect end!");
        return true;
    }

    public send(data:Uint8Array<ArrayBuffer>) {
        if (this.client) {
            this.client.send(data);
        }
    }
    
    public on_recv(recv:(data:Uint8Array) => void) {
        if (this.client) {
            this.client.onmessage = (evt) =>{ 
                if (Buffer.isBuffer(evt.data)) {
                    recv(new Uint8Array(evt.data));
                }
                else if (Array.isArray(evt.data)) {
                    recv(new Uint8Array(Buffer.concat(evt.data)));
                }
                else if (evt.data instanceof ArrayBuffer) {
                    recv(new Uint8Array(evt.data));
                }
           };
        }
    }
}
   
class WSContext extends engine.context {
    public ConnectWebSocket(wsHost:string) : engine.channel {
        this.ch = new WSChannel();
        this.ch.connect(wsHost);
        this.ch.on_recv(this.recv.bind(this));
        return this.ch;
    }
}

@ccclass('new_driver')
export class new_driver extends Component {
    private _app: engine.app;

    @property({ type: CCInteger, tooltip: "Platform Type" })
    platform = login.em_platform.EPlatformGoogle;

    private _SDK:SdkInterface;

    start() {
        if (this.platform == login.em_platform.EPlatformGoogle) {
            (window as any).onGooglePlayAuthResult = (success: boolean, result: string) => {
                if (success) {
                    console.log('[GooglePlay] 获取 AuthCode 成功:', result);
                    this.sendAuthCodeToGameServer(result);
                } else {
                    console.error('[GooglePlay] 鉴权失败:', result);
                }
            };
        }
        else if (this.platform == login.em_platform.EPlatformWXMiniGame) {
            this._SDK = SetPlatform(this.platform);
        }

        this._app = new engine.app();
        this._app.build(new ClientEventHandle());
        this._app.connect_websocket(new WSContext(), "wss://www.ucat.games:8100");
        this._app.on_conn = () => {
            if (sys.isNative && sys.os === sys.OS.ANDROID) {
                native.reflection.callStaticMethod(
                    'com/cocos/game/AppActivity',
                    'requestServerSideAccess',
                    '()V'
                );
            } else if (this.platform == login.em_platform.EPlatformWXMiniGame) {
                this._SDK.login((code:string) => {
                    console.log(`WxSdk login success! Code: ${code}`);
                    this.sendAuthCodeToGameServer(code);
                });
            }
        }
        this._app.register("LoginCharacterCallback", async (entity_id: string, description: object) => {
            let create_character = await BundleManager.Instance.LoadAssetFromBundle2<Prefab>("create_character", `LoginCharacter`, Prefab);
            return LoginCallback.Creator(entity_id, instantiate(create_character), description);
        });

        director.addPersistRootNode(this.node);
    }

    update(deltaTime: number) {
        this._app.poll();
    }

    private sendAuthCodeToGameServer(authCode: string) {
        engine.app.instance.login(authCode, {"em_platform":this.platform})
    }
}