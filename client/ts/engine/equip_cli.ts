import * as engine from "./engine";
import { encode, decode } from "@msgpack/msgpack";
import * as common from "./common_cli";
// this enum code is codegen by geese codegen for ts

// this struct code is codegen by geese codegen for ts
// this caller code is codegen by geese codegen for typescript
export class equip_wear_equip_cb {
    public entity:engine.subentity|engine.player;
    public cb:((equips:Array<common.equip_info>, weapon:common.weapon_info, shooting:common.shooting_info) => void)|null = null;
    public err:((err:common.error_code) => void)|null = null;
    public rsp:engine.callback;
    public constructor(_cb_uuid:number, _entity:engine.subentity|engine.player) {
        this.entity = _entity
        this.rsp = new engine.callback(() => { return this.entity.del_callback(_cb_uuid); });
        this.entity.reg_hub_callback(_cb_uuid, this.rsp)

    }

    private on_rsp(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _equips:Array<common.equip_info> = [];
        for (let v_10d8619a_ef87_53c6_b028_8501d96c0af7 of inArray[0]) {
            _equips.push(common.protcol_to_equip_info(v_10d8619a_ef87_53c6_b028_8501d96c0af7))
        }
        let _weapon = common.protcol_to_weapon_info(inArray[1]);
        let _shooting = common.protcol_to_shooting_info(inArray[2]);
        if (this.cb) this.cb.call(null, _equips, _weapon, _shooting);

    }

    private on_err(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _err = inArray[0];
        if (this.err) this.err.call(null, _err, )

    }

    public callBack(_cb:(equips:Array<common.equip_info>, weapon:common.weapon_info, shooting:common.shooting_info) => void, _err:(err:common.error_code) => void) {
        this.cb = _cb;
        this.err = _err;
        this.rsp.callback(this.on_rsp.bind(this), this.on_err.bind(this));
        return this.rsp;
    }

}

export class equip_caller {
    public entity:engine.subentity|engine.player;
    public constructor(entity:engine.subentity|engine.player) {
        this.entity = entity;
    }

    public  wear_equip(equip_id:string) {
        let _argv_29899057_23ab_3371_9bff_b3c5a5aec1a2:any[] = []
        _argv_29899057_23ab_3371_9bff_b3c5a5aec1a2.push(equip_id);
        let _cb_uuid = this.entity.call_hub_request("wear_equip", encode(_argv_29899057_23ab_3371_9bff_b3c5a5aec1a2));
        return new equip_wear_equip_cb(_cb_uuid, this.entity);
    }

}


