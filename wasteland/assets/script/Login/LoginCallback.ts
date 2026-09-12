import { Node, Prefab, instantiate } from 'cc';
import * as engine from '../ServerSDK/engine/engine' 
import * as login_cli from '../ServerSDK/engine/login_cli'
import { CreateCharacter } from './CreateCharacter'

export class LoginCallback extends engine.player {
    private _login_caller: login_cli.login_caller;
    public CreateCharacter: CreateCharacter;

    public constructor(entity_id: string) {
        super("LoginCallback", entity_id)
        this._login_caller = new login_cli.login_caller(this);
    }
    
    public update_player(argvs: object) {
        console.log(`LoginCallback:${this.EntityID} update_player!`);
    }

    public async create_character(node:Node) {
        this.CreateCharacter = new CreateCharacter();
        await this.CreateCharacter.Init(node, this._login_caller);
    }

    public static async Creator(entity_id: string, createCharacter:Prefab, description: object) {
        console.log(`LoginCallback:${entity_id}`);
        let impl = new LoginCallback(entity_id)
        let c = description["Characters"] as Array<object>;
        if (c.length > 0) {
            impl._login_caller.select_character(c[0]["player_id"]).callBack(
                (info) => { 
                    console.log(`LoginCallback login success:${info}`) 
                },
                (_err) => { 
                    console.log(`LoginCallback login _err:${_err}`) 
                } 
            ).timeout(1000, () => { 
                console.log(`LoginCallback login timeout!`) 
            });
        }
        else {
            await impl.create_character(instantiate(createCharacter));
        }
        return impl
    }
}