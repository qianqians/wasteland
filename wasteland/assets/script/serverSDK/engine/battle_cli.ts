import * as engine from "./engine/index.ts";
import { encode, decode } from "./engine/@msgpack/msgpack/index.ts";
import * as common from "./common_cli.ts";
// this enum code is codegen by geese codegen for ts

// this struct code is codegen by geese codegen for ts
// this caller code is codegen by geese codegen for typescript
export class battle_use_skill_cb {
    public entity:engine.subentity|engine.player;
    public cb:(() => void)|null = null;
    public err:((err:common.error_code) => void)|null = null;
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
        let _err = inArray[0];
        if (this.err) this.err.call(null, _err)

    }

    public callBack(_cb:() => void, _err:(err:common.error_code) => void) {
        this.cb = _cb;
        this.err = _err;
        this.rsp.callback(this.on_rsp.bind(this), this.on_err.bind(this));
        return this.rsp;
    }

}

export class battle_use_item_cb {
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

export class battle_caller {
    public entity:engine.subentity|engine.player;
    public constructor(entity:engine.subentity|engine.player) {
        this.entity = entity;
    }

    public  use_skill(skill_id:number) {
        let _argv_f54ecac1_af9c_3003_a2f2_ed93134bfdfe:any[] = []
        _argv_f54ecac1_af9c_3003_a2f2_ed93134bfdfe.push(skill_id);
        let _cb_uuid = this.entity.call_hub_request("use_skill", encode(_argv_f54ecac1_af9c_3003_a2f2_ed93134bfdfe));
        return new battle_use_skill_cb(_cb_uuid, this.entity);
    }

    public  use_item(item_id:string) {
        let _argv_8e931b2d_2ecb_30da_928a_750ecb587c14:any[] = []
        _argv_8e931b2d_2ecb_30da_928a_750ecb587c14.push(item_id);
        let _cb_uuid = this.entity.call_hub_request("use_item", encode(_argv_8e931b2d_2ecb_30da_928a_750ecb587c14));
        return new battle_use_item_cb(_cb_uuid, this.entity);
    }

}


