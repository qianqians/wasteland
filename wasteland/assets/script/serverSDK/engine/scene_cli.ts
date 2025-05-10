import * as engine from "./engine";
import { encode, decode } from "./engine/@msgpack/msgpack";
import * as common from "./common_cli";
// this enum code is codegen by geese codegen for ts

// this struct code is codegen by geese codegen for ts
// this caller code is codegen by geese codegen for typescript
export class scene_caller {
    public entity:engine.subentity|engine.player;
    public constructor(entity:engine.subentity|engine.player) {
        this.entity = entity;
    }

    public  move(dir:common.em_direction, pos:common.position) {
        let _argv_33efb72e_9227_32af_a058_169be114a277 = []
        _argv_33efb72e_9227_32af_a058_169be114a277.push(dir);
        _argv_33efb72e_9227_32af_a058_169be114a277.push(common.position_to_protcol(pos));
        this.entity.call_hub_notify("move", encode(_argv_33efb72e_9227_32af_a058_169be114a277))
    }

}


