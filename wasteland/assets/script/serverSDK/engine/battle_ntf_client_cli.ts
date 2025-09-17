import * as engine from "./engine";
import { encode, decode } from "./engine/@msgpack/msgpack";
import * as common from "./common_cli";
// this enum code is codegen by geese codegen for ts

// this struct code is codegen by geese codegen for ts
// this module code is codegen by geese codegen for typescript
export class battle_ntf_client_module {
    public entity:engine.player|engine.subentity|engine.receiver;
    public on_use_skill:((s:engine.session, skill_id:number, pos:common.position) => void)[] = [];
    public on_harm:((s:engine.session, attack_entity_id:string, skill_id:number, pos:common.position, harm_type:common.em_harm_type, harm_value:number) => void)[] = [];
    public constructor(entity:engine.player|engine.subentity|engine.receiver) {
        this.entity = entity;
        this.entity.reg_hub_notify_callback("use_skill", this.use_skill);
        this.entity.reg_hub_notify_callback("harm", this.harm);
    }

    public use_skill(hub_name:string, bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _skill_id = inArray[0];
        let _pos = common.protcol_to_position(inArray[1]);
        let s = new engine.session(hub_name)
        for (let fn of this.on_use_skill) {
            fn(s, _skill_id, _pos);
        }
    }

    public harm(hub_name:string, bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _attack_entity_id = inArray[0];
        let _skill_id = inArray[1];
        let _pos = common.protcol_to_position(inArray[2]);
        let _harm_type = inArray[3];
        let _harm_value = inArray[4];
        let s = new engine.session(hub_name)
        for (let fn of this.on_harm) {
            fn(s, _attack_entity_id, _skill_id, _pos, _harm_type, _harm_value);
        }
    }

}


