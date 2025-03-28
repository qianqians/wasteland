import * as engine from "./engine";
import { encode, decode } from "@msgpack/msgpack";
import * as common from "./common_cli";
// this enum code is codegen by geese codegen for ts

// this struct code is codegen by geese codegen for ts
// this module code is codegen by geese codegen for typescript
    public constructor(entity:player|engine.subentity|engine.receiver) {
        this.entity = entity;
        this.entity.reg_hub_notify_callback("move", this.move);
    }

    public move(hub_name:string, bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _dir = inArray[0];
        let _pos = common.protcol_to_position(inArray[1]);
        let s = new engine.session(hub_name)
        for (let fn of this.on_move) {
            fn(s, _dir, _pos);
        }
    }

}


