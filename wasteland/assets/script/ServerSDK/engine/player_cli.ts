import * as engine from "./engine";
import { encode, decode } from "./engine/@msgpack/msgpack";
import * as common from "./common_cli";
// this enum code is codegen by geese codegen for ts

// this struct code is codegen by geese codegen for ts
// this caller code is codegen by geese codegen for typescript
export class player_into_scene_cb {
    public entity:engine.subentity|engine.player;
    public cb:(() => void)|null = null;
    public err:((err_code:number) => void)|null = null;
    public rsp:engine.callback;
    public constructor(_cb_uuid:number, _entity:engine.subentity|engine.player) {
        this.entity = _entity
        this.rsp = new engine.callback(() => { return this.entity.del_callback(_cb_uuid); });
        this.entity.reg_hub_callback(_cb_uuid, this.rsp)

    }

    private on_rsp(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        if (this.cb) this.cb.call(null, );

    }

    private on_err(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _err_code = inArray[0];
        if (this.err) this.err.call(null, _err_code)

    }

    public callBack(_cb:() => void, _err:(err_code:number) => void) {
        this.cb = _cb;
        this.err = _err;
        this.rsp.callback(this.on_rsp.bind(this), this.on_err.bind(this));
        return this.rsp;
    }

}

export class player_talk_npc_cb {
    public entity:engine.subentity|engine.player;
    public cb:(() => void)|null = null;
    public err:((err_code:number) => void)|null = null;
    public rsp:engine.callback;
    public constructor(_cb_uuid:number, _entity:engine.subentity|engine.player) {
        this.entity = _entity
        this.rsp = new engine.callback(() => { return this.entity.del_callback(_cb_uuid); });
        this.entity.reg_hub_callback(_cb_uuid, this.rsp)

    }

    private on_rsp(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        if (this.cb) this.cb.call(null, );

    }

    private on_err(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _err_code = inArray[0];
        if (this.err) this.err.call(null, _err_code)

    }

    public callBack(_cb:() => void, _err:(err_code:number) => void) {
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

    public  into_scene(scene_name:string, scene_line:number) {
        let _argv_85dc3aca_241a_3c31_ae2e_37e652224427:any[] = []
        _argv_85dc3aca_241a_3c31_ae2e_37e652224427.push(scene_name);
        _argv_85dc3aca_241a_3c31_ae2e_37e652224427.push(scene_line);
        let _cb_uuid = this.entity.call_hub_request("into_scene", encode(_argv_85dc3aca_241a_3c31_ae2e_37e652224427));
        return new player_into_scene_cb(_cb_uuid, this.entity);
    }

    public  talk_npc(talk_id:number) {
        let _argv_88591603_b9dc_329d_b620_1069b44d5646:any[] = []
        _argv_88591603_b9dc_329d_b620_1069b44d5646.push(talk_id);
        let _cb_uuid = this.entity.call_hub_request("talk_npc", encode(_argv_88591603_b9dc_329d_b620_1069b44d5646));
        return new player_talk_npc_cb(_cb_uuid, this.entity);
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


