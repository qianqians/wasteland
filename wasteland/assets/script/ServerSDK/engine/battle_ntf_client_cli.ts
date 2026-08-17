import * as engine from "./engine";
import { encode, decode } from "./engine/@msgpack/msgpack";
import * as common from "./common_cli";
// this enum code is codegen by geese codegen for ts

// this struct code is codegen by geese codegen for ts
export class harm {
     public be_attack_entity_id:string = ""
     public skill_id:number = 0
     public harm_value:number = 0
     public is_dead:boolean = false
}

export function harm_to_protcol(_struct:harm) {
    let _protocol:any = {}
    _protocol["be_attack_entity_id"] = _struct.be_attack_entity_id
    _protocol["skill_id"] = _struct.skill_id
    _protocol["harm_value"] = _struct.harm_value
    _protocol["is_dead"] = _struct.is_dead
    return _protocol;
}

export function protcol_to_harm(_protocol:any) {
    let _struct = new harm()
    for (let key in _protocol) {
        let val = _protocol[key];
        if (key == "be_attack_entity_id") {
            _struct.be_attack_entity_id = val;
        }
        else if (key == "skill_id") {
            _struct.skill_id = val;
        }
        else if (key == "harm_value") {
            _struct.harm_value = val;
        }
        else if (key == "is_dead") {
            _struct.is_dead = val;
        }
    }
    return _struct;

}

// this module code is codegen by geese codegen for typescript
export class battle_ntf_client_module {
    public entity:engine.player|engine.subentity|engine.receiver;
    public on_start_battle:((s:engine.session, self_side:common.player_battle_info, enemy:common.player_battle_info) => void)[] = [];
    public on_use_skill:((s:engine.session, caster:string, hits:Array<harm>) => void)[] = [];
    public constructor(entity:engine.player|engine.subentity|engine.receiver) {
        this.entity = entity;
        this.entity.reg_hub_notify_callback("start_battle", this.start_battle);
        this.entity.reg_hub_notify_callback("use_skill", this.use_skill);
    }

    public start_battle(hub_name:string, bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _self_side = common.protcol_to_player_battle_info(inArray[0]);
        let _enemy = common.protcol_to_player_battle_info(inArray[1]);
        let s = new engine.session(hub_name)
        for (let fn of this.on_start_battle) {
            fn(s, _self_side, _enemy);
        }
    }

    public use_skill(hub_name:string, bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _caster = inArray[0];
        let _hits:Array<harm> = [];
        for (let v_84c0e237_1395_5b20_b7fa_478a639ad4b4 of inArray[1]) {
            _hits.push(protcol_to_harm(v_84c0e237_1395_5b20_b7fa_478a639ad4b4))
        }
        let s = new engine.session(hub_name)
        for (let fn of this.on_use_skill) {
            fn(s, _caster, _hits);
        }
    }

}


