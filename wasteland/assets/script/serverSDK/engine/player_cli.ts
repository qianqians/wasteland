import * as engine from "./engine/index";
import { encode, decode } from "./engine/@msgpack/msgpack";
import * as common from "./common_cli";
// this enum code is codegen by geese codegen for ts

// this struct code is codegen by geese codegen for ts
// this caller code is codegen by geese codegen for typescript
export class player_get_task_list_cb {
    public entity:engine.subentity|engine.player;
    public cb:((tasks:Array<common.task_info>) => void)|null = null;
    public err:(() => void)|null = null;
    public rsp:engine.callback;
    public constructor(_cb_uuid:number, _entity:engine.subentity|engine.player) {
        this.entity = _entity
        this.rsp = new engine.callback(() => { return this.entity.del_callback(_cb_uuid); });
        this.entity.reg_hub_callback(_cb_uuid, this.rsp)

    }

    private on_rsp(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _tasks:Array<common.task_info> = [];
        for (let v_9b78b6ab_a6db_5ec0_a23e_7f18c1d576b5 of inArray[0]) {
            _tasks.push(common.protcol_to_task_info(v_9b78b6ab_a6db_5ec0_a23e_7f18c1d576b5))
        }
        if (this.cb) this.cb.call(null, _tasks);

    }

    private on_err(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        if (this.err) this.err.call(null, )

    }

    public callBack(_cb:(tasks:Array<common.task_info>) => void, _err:() => void) {
        this.cb = _cb;
        this.err = _err;
        this.rsp.callback(this.on_rsp.bind(this), this.on_err.bind(this));
        return this.rsp;
    }

}

export class player_caller {
    public entity:engine.subentity|engine.player;
    public constructor(entity:engine.subentity|engine.player) {
        this.entity = entity;
    }

    public  get_task_list() {
        let _argv_c39e0b8b_cdb0_31c9_a8cb_c48f200c387a:any[] = []
        let _cb_uuid = this.entity.call_hub_request("get_task_list", encode(_argv_c39e0b8b_cdb0_31c9_a8cb_c48f200c387a));
        return new player_get_task_list_cb(_cb_uuid, this.entity);
    }

}


