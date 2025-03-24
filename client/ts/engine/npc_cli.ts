import * as engine from "./engine";
import { encode, decode } from "@msgpack/msgpack";
import * as common from "./common_cli";
// this enum code is codegen by geese codegen for ts

// this struct code is codegen by geese codegen for ts
// this caller code is codegen by geese codegen for typescript
export class npc_accept_task_cb {
    public entity:engine.subentity|engine.player;
    public cb:((tasks:Array<common.task_info>) => void)|null = null;
    public err:((err:common.error_code) => void)|null = null;
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
        let _err = inArray[0];
        if (this.err) this.err.call(null, _err)

    }

    public callBack(_cb:(tasks:Array<common.task_info>) => void, _err:(err:common.error_code) => void) {
        this.cb = _cb;
        this.err = _err;
        this.rsp.callback(this.on_rsp.bind(this), this.on_err.bind(this));
        return this.rsp;
    }

}

export class npc_complete_task_cb {
    public entity:engine.subentity|engine.player;
    public cb:((tasks:Array<common.task_info>) => void)|null = null;
    public err:((err:common.error_code) => void)|null = null;
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
        let _err = inArray[0];
        if (this.err) this.err.call(null, _err)

    }

    public callBack(_cb:(tasks:Array<common.task_info>) => void, _err:(err:common.error_code) => void) {
        this.cb = _cb;
        this.err = _err;
        this.rsp.callback(this.on_rsp.bind(this), this.on_err.bind(this));
        return this.rsp;
    }

}

export class npc_purchase_cb {
    public entity:engine.subentity|engine.player;
    public cb:((items:Array<common.item>) => void)|null = null;
    public err:((err:common.error_code) => void)|null = null;
    public rsp:engine.callback;
    public constructor(_cb_uuid:number, _entity:engine.subentity|engine.player) {
        this.entity = _entity
        this.rsp = new engine.callback(() => { return this.entity.del_callback(_cb_uuid); });
        this.entity.reg_hub_callback(_cb_uuid, this.rsp)

    }

    private on_rsp(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _items:Array<common.item> = [];
        for (let v_bf5596fb_837a_5272_bf0d_cd29c7c99192 of inArray[0]) {
            _items.push(common.protcol_to_item(v_bf5596fb_837a_5272_bf0d_cd29c7c99192))
        }
        if (this.cb) this.cb.call(null, _items);

    }

    private on_err(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _err = inArray[0];
        if (this.err) this.err.call(null, _err)

    }

    public callBack(_cb:(items:Array<common.item>) => void, _err:(err:common.error_code) => void) {
        this.cb = _cb;
        this.err = _err;
        this.rsp.callback(this.on_rsp.bind(this), this.on_err.bind(this));
        return this.rsp;
    }

}

export class npc_caller {
    public entity:engine.subentity|engine.player;
    public constructor(entity:engine.subentity|engine.player) {
        this.entity = entity;
    }

    public  accept_task(task_id:number) {
        let _argv_300a447a_63f4_3f9b_8d00_4f2be030e6f1:any[] = []
        _argv_300a447a_63f4_3f9b_8d00_4f2be030e6f1.push(task_id);
        let _cb_uuid = this.entity.call_hub_request("accept_task", encode(_argv_300a447a_63f4_3f9b_8d00_4f2be030e6f1));
        return new npc_accept_task_cb(_cb_uuid, this.entity);
    }

    public  complete_task(task_id:number) {
        let _argv_24f1bbd4_24d5_33cf_82be_64a44d300cd8:any[] = []
        _argv_24f1bbd4_24d5_33cf_82be_64a44d300cd8.push(task_id);
        let _cb_uuid = this.entity.call_hub_request("complete_task", encode(_argv_24f1bbd4_24d5_33cf_82be_64a44d300cd8));
        return new npc_complete_task_cb(_cb_uuid, this.entity);
    }

    public  purchase(item_id:number) {
        let _argv_e0c7fe5d_7700_3643_ac3f_27cfc058984b:any[] = []
        _argv_e0c7fe5d_7700_3643_ac3f_27cfc058984b.push(item_id);
        let _cb_uuid = this.entity.call_hub_request("purchase", encode(_argv_e0c7fe5d_7700_3643_ac3f_27cfc058984b));
        return new npc_purchase_cb(_cb_uuid, this.entity);
    }

}


