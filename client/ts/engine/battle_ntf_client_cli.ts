import * as engine from "./engine";
import { encode, decode } from "@msgpack/msgpack";
import * as common from "./common_cli";
// this enum code is codegen by geese codegen for ts

// this struct code is codegen by geese codegen for ts
// this module code is codegen by geese codegen for typescript
    public constructor(entity:player|engine.subentity|engine.receiver) {
        this.entity = entity;
        this.entity.reg_hub_notify_callback("use_skill", this.use_skill);
        this.entity.reg_hub_notify_callback("harm", this.harm);
    }

    public use_skill(hub_name:string, bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _skill_id = inArray[0];
        let _dir = inArray[1];
        let _pos = common.protcol_to_position(inArray[2]);
        let s = new engine.session(hub_name)
        for (let fn of this.on_use_skill) {
            fn(s, _skill_id, _dir, _pos);
        }
    }

    public harm(hub_name:string, bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _skill_id = inArray[0];
        let _dir = inArray[1];
        let _pos = common.protcol_to_position(inArray[2]);
        let _harm_type = inArray[3];
        let _harm_value = inArray[4];
        let s = new engine.session(hub_name)
        for (let fn of this.on_harm) {
            fn(s, _skill_id, _dir, _pos, _harm_type, _harm_value);
        }
    }

}


