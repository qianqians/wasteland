import * as engine from "./engine";
import { encode, decode } from "./engine/@msgpack/msgpack";
import * as common from "./common_cli";
// this enum code is codegen by geese codegen for ts

// this struct code is codegen by geese codegen for ts
// this caller code is codegen by geese codegen for typescript
export class battle_start_battle_cb {
    public entity:engine.subentity|engine.player;
    public cb:((self:common.team, enemy:common.team) => void)|null = null;
    public err:((err:common.error_code) => void)|null = null;
    public rsp:engine.callback;
    public constructor(_cb_uuid:number, _entity:engine.subentity|engine.player) {
        this.entity = _entity
        this.rsp = new engine.callback(() => { return this.entity.del_callback(_cb_uuid); });
        this.entity.reg_hub_callback(_cb_uuid, this.rsp)

    }

    private on_rsp(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _self = common.protcol_to_team(inArray[0]);
        let _enemy = common.protcol_to_team(inArray[1]);
        if (this.cb) this.cb.call(null, _self, _enemy);

    }

    private on_err(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _err = inArray[0];
        if (this.err) this.err.call(null, _err, )

    }

    public callBack(_cb:(self:common.team, enemy:common.team) => void, _err:(err:common.error_code) => void) {
        this.cb = _cb;
        this.err = _err;
        this.rsp.callback(this.on_rsp.bind(this), this.on_err.bind(this));
        return this.rsp;
    }

}

export class battle_auto_battle_cb {
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
    public cb:((item:common.item) => void)|null = null;
    public err:((err:common.error_code) => void)|null = null;
    public rsp:engine.callback;
    public constructor(_cb_uuid:number, _entity:engine.subentity|engine.player) {
        this.entity = _entity
        this.rsp = new engine.callback(() => { return this.entity.del_callback(_cb_uuid); });
        this.entity.reg_hub_callback(_cb_uuid, this.rsp)

    }

    private on_rsp(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _item = common.protcol_to_item(inArray[0]);
        if (this.cb) this.cb.call(null, _item);

    }

    private on_err(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _err = inArray[0];
        if (this.err) this.err.call(null, _err)

    }

    public callBack(_cb:(item:common.item) => void, _err:(err:common.error_code) => void) {
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

    public  start_battle(enemy_id:string) {
        let _argv_01e120b2_ff3e_35bc_b812_e0d6fa294873:any[] = []
        _argv_01e120b2_ff3e_35bc_b812_e0d6fa294873.push(enemy_id);
        let _cb_uuid = this.entity.call_hub_request("start_battle", encode(_argv_01e120b2_ff3e_35bc_b812_e0d6fa294873));
        return new battle_start_battle_cb(_cb_uuid, this.entity);
    }

    public  auto_battle() {
        let _argv_c83b89ec_ce1c_31e7_964d_507d39716743:any[] = []
        let _cb_uuid = this.entity.call_hub_request("auto_battle", encode(_argv_c83b89ec_ce1c_31e7_964d_507d39716743));
        return new battle_auto_battle_cb(_cb_uuid, this.entity);
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


