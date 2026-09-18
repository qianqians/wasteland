import { _decorator, Component, Node, CCInteger, director, sys, native, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;
import * as engine from './engine/engine'
import * as login from './engine/login_cli'
import { LoginCallback } from '../Login/LoginCallback'
import { BundleManager } from '../tools/BundleManager/BundleManager';
import { SdkInterface, SetPlatform } from '../SDK/SdkInterface';
import { Loading } from '../Loading/Loading';

import buffer from 'buffer';
const { Buffer } = buffer;
if (typeof window !== 'undefined') {
    (window as any).Buffer = Buffer;
}
if (typeof globalThis !== 'undefined') {
    (globalThis as any).Buffer = Buffer;
}

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
            console.log("WSChannel connect complete! msg:", evt?.type);
        }
        this.client.onclose = (evt) => {
            console.log("WSChannel onclose! msg:", evt?.type);
        };
        this.client.onerror = (evt) => {
            console.log("WSChannel onerror! msg:", evt?.type);
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
    public constructor() {
        super();
    }

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
    private _curr_node: Node;

    @property({ type: CCInteger, tooltip: "Platform Type" })
    platform: login.em_platform = login.em_platform.EPlatformWXMiniGame;

    private _SDK:SdkInterface;

    start() {
        console.log(`new_driver start! platform:${this.platform} == EPlatformWXMiniGame:${login.em_platform.EPlatformWXMiniGame}`);

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
        this._app.on_conn = async () => {
            let loadPage = this.node.getChildByPath("login");
            let loading = new Loading();
            loading.OnLoadingDone = () => {
                console.log(`on_conn callback! platform:${this.platform} == EPlatformWXMiniGame:${login.em_platform.EPlatformWXMiniGame}`);
                if (sys.isNative && sys.os === sys.OS.ANDROID) {
                    native.reflection.callStaticMethod(
                        'com/cocos/game/AppActivity',
                        'requestServerSideAccess',
                        '()V'
                    );
                } else if (this.platform == login.em_platform.EPlatformWXMiniGame) {
                    console.log("WxSdk login begin!");
                    this._SDK.login((code:string) => {
                        console.log(`WxSdk login success! Code: ${code}`);
                        this.sendAuthCodeToGameServer(code);
                    });
                }
            };
            await loading.StartLoading(loadPage, "Progress", ["create_character", "role", "map_skyland", "map_stalactite_cave"]);
        }
        
        this._app.register("LoginCharacterCallback", async (entity_id: string, description: object) => {
            console.log(`new_driver register LoginCharacterCallback! entity_id:${entity_id} description:${JSON.stringify(description)}`);
            let createCharacter = await BundleManager.Instance.LoadAssetFromBundle2<Prefab>("create_character", `LoginCharacter`, Prefab);
            let createCharacterNode = instantiate(createCharacter);
            this.updateLastNode(createCharacterNode);
            let entity = await LoginCallback.Creator(entity_id, createCharacterNode, description);
            return entity;
        });
        this._app.register("player_data", async (entity_id: string, description: object) => {
            console.log(`into game`)
            //this.updateLastNode();
        });

        director.addPersistRootNode(this.node);

        console.log(`new_driver end! platform:${this.platform} == EPlatformWXMiniGame:${login.em_platform.EPlatformWXMiniGame}`);
    }

    private updateLastNode(node:Node) {
        if (this._curr_node) {
            this._curr_node.destroy();
            this._curr_node = null;
        }
        this._curr_node = node;
        this._curr_node.parent = this.node;
    }

    update(deltaTime: number) {
        this._app.poll();
    }

    private sendAuthCodeToGameServer(authCode: string) {
        engine.app.instance.login(authCode, {"em_platform":this.platform})
    }
}