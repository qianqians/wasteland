import * as engine from "./engine";
import { encode, decode } from "./engine/@msgpack/msgpack";
import * as common from "./common_cli";
// this enum code is codegen by geese codegen for ts

// this struct code is codegen by geese codegen for ts
// this caller code is codegen by geese codegen for typescript
export class player_caller {
    public entity:engine.subentity|engine.player;
    public constructor(entity:engine.subentity|engine.player) {
        this.entity = entity;
    }

    public  get_task_info() {
        let _argv_4326ae65_6fc1_3c61_8788_123909ff1f74 = []
        this.entity.call_hub_notify("get_task_info", encode(_argv_4326ae65_6fc1_3c61_8788_123909ff1f74))
    }

    public  completed_task(task_id:number) {
        let _argv_0c8b1a05_e8bd_34b5_b563_896b2528a30e = []
        _argv_0c8b1a05_e8bd_34b5_b563_896b2528a30e.push(task_id);
        this.entity.call_hub_notify("completed_task", encode(_argv_0c8b1a05_e8bd_34b5_b563_896b2528a30e))
    }

}


