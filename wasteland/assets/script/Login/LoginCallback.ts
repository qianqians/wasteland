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

    public static async Creator(entity_id: string, loading: Loading, loadPage: Node, description: object) {
        console.log(`LoginCallback:${entity_id}`);
        let impl = new LoginCallback(entity_id)
        let c = description["Characters"] as Array<object>;
        if (c.length > 0) {
            impl._login_caller.select_character(c[0]["player_id"]).callBack(
                async (info) => { 
                    console.log(`LoginCallback login success:${info}`) 
                    await loading.StartLoading(loadPage, "Progress", ["role", "map_skyland", "map_stalactite_cave"]);
                        
                },
                (_err) => { 
                    console.log(`LoginCallback login _err:${_err}`) 
                } 
            ).timeout(1000, () => { 
                console.log(`LoginCallback login timeout!`) 
            });
        }
        else {
            await loading.StartLoading(loadPage, "Progress", ["create_character", "role", "map_skyland", "map_stalactite_cave"]);
            let createCharacterPrefab = await BundleManager.Instance.LoadAssetFromBundle2<Prefab>("create_character", `LoginCharacter`, Prefab);
            let createCharacterNode = instantiate(createCharacterPrefab);
            await impl.create_character(createCharacterNode);
        }
        return impl
    }
}