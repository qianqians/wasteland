import { Node, Prefab, instantiate } from 'cc';
import * as engine from '../ServerSDK/engine/engine'
import * as login_cli from '../ServerSDK/engine/login_cli'
import { BundleManager } from '../tools/BundleManager/BundleManager';
import { CreateCharacter } from './CreateCharacter'
import { Loading } from '../Loading/Loading'

export class LoginCallback extends engine.player {
    private _login_caller: login_cli.login_caller;
    public CreateCharacter: CreateCharacter;
    public CreateCharacterNode: Node;

    private _select_retry: number = 0;
    private static readonly max_select_retry = 5;
    private static readonly select_retry_delay = 2000;

    public constructor(entity_id: string) {
        super("LoginCallback", entity_id)
        this._login_caller = new login_cli.login_caller(this);
    }

    public update_player(argvs: object) {
        console.log(`LoginCallback:${this.EntityID} update_player!`);
    }

    public async create_character(node:Node) {
        this.CreateCharacterNode = node;
        this.CreateCharacter = new CreateCharacter();
        await this.CreateCharacter.Init(node, this._login_caller);
    }

    public static async Creator(entity_id: string, description: object) {
        console.log(`LoginCallback:${entity_id}`);
        let impl = new LoginCallback(entity_id);
        let c = description["Characters"] as Array<object>;
        if (c.length > 0) {
            impl.select_character(c[0]["player_id"]);
        }
        else {
            let createCharacterPrefab = await BundleManager.Instance.LoadAssetFromBundle2<Prefab>("create_character", `LoginCharacter`, Prefab);
            let createCharacterNode = instantiate(createCharacterPrefab);
            await impl.create_character(createCharacterNode);
        }
        return impl
    }

    /**
     * 选角请求。
     *
     * ⚠ 一定要传 err 回调：engine.player.handle_hub_response_error 里是
     * `if (_call_handle && _call_handle._error)`，服务端回错误时如果这里没传，
     * 既不回调也不删 callback，客户端就完全静默 —— 表现就是"失去响应"，
     * 而服务端其实已经把错误码发过来了（比如 6 = undefined_player_id：
     * 选角时场景服没在 consul 注册 / 查不到该角色的入场信息）。
     */
    public select_character(player_id: string) {
        this._login_caller.select_character(player_id).callBack(
            async () => {
                try {
                    this._select_retry = 0;
                } catch (e) {
                    console.log(`LoginCallback login _err:${e}`)
                }
            },
            (errCode: number) => {
                console.log(`LoginCallback select_character err:${errCode}`)
                this.__retry_select_character__(player_id, `err:${errCode}`)
            }
        ).timeout(1500, () => {
            console.log(`LoginCallback login timeout!`)
            this.__retry_select_character__(player_id, "timeout")
        });
    }

    private __retry_select_character__(player_id: string, reason: string) {
        if (this._select_retry >= LoginCallback.max_select_retry) {
            console.log(`LoginCallback select_character 连续失败(${reason})，不再重试：多半是场景服没起来/没注册进 consul`)
            return
        }
        this._select_retry++;
        console.log(`LoginCallback select_character 第${this._select_retry}次重试(${reason})`)
        setTimeout(() => this.select_character(player_id), LoginCallback.select_retry_delay);
    }
}
