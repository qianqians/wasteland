import * as engine from "./engine";
import { encode, decode } from "./engine/@msgpack/msgpack";
import * as common from "./common_cli";
// this enum code is codegen by geese codegen for ts

// this struct code is codegen by geese codegen for ts
// this module code is codegen by geese codegen for typescript
export class scene_ntf_client_module {
    public entity:engine.player|engine.subentity|engine.receiver;
    public on_move:((s:engine.session, pos:common.position) => void)[] = [];
    public on_entity_refresh:((s:engine.session, info:Uint8Array) => void)[] = [];
    public constructor(entity:engine.player|engine.subentity|engine.receiver) {
        this.entity = entity;
        this.entity.reg_hub_notify_callback("move", this.move);
        this.entity.reg_hub_notify_callback("entity_refresh", this.entity_refresh);
    }

    public move(hub_name:string, bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _pos = common.protcol_to_position(inArray[0]);
        let s = new engine.session(hub_name)
        for (let fn of this.on_move) {
            fn(s, _pos);
        }
    }

    public entity_refresh(hub_name:string, bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _info = inArray[0];
        let s = new engine.session(hub_name)
        for (let fn of this.on_entity_refresh) {
            fn(s, _info);
        }
    }

}


