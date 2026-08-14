import * as engine from "./engine";
import { encode, decode } from "./engine/@msgpack/msgpack";
import * as common from "./common_cli";
// this enum code is codegen by geese codegen for ts

export enum em_platform {
    EPlatformWX = 1,
    EPlatformTap = 2,
    EPlatformDy = 3,
}

// this struct code is codegen by geese codegen for ts
// this caller code is codegen by geese codegen for typescript
export class login_get_character_cb {
    public entity:engine.subentity|engine.player;
    public cb:((player:Array<common.player_info>) => void)|null = null;
    public err:((errCode:number) => void)|null = null;
    public rsp:engine.callback;
    public constructor(_cb_uuid:number, _entity:engine.subentity|engine.player) {
        this.entity = _entity
        this.rsp = new engine.callback(() => { return this.entity.del_callback(_cb_uuid); });
        this.entity.reg_hub_callback(_cb_uuid, this.rsp)

    }

    private on_rsp(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _player:Array<common.player_info> = [];
        for (let v_be0298d9_3298_5e5f_ae83_c00e58168711 of inArray[0]) {
            _player.push(common.protcol_to_player_info(v_be0298d9_3298_5e5f_ae83_c00e58168711))
        }
        if (this.cb) this.cb.call(null, _player);

    }

    private on_err(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _errCode = inArray[0];
        if (this.err) this.err.call(null, _errCode)

    }

    public callBack(_cb:(player:Array<common.player_info>) => void, _err:(errCode:number) => void) {
        this.cb = _cb;
        this.err = _err;
        this.rsp.callback(this.on_rsp.bind(this), this.on_err.bind(this));
        return this.rsp;
    }

}

export class login_create_character_cb {
    public entity:engine.subentity|engine.player;
    public cb:((player:common.player_info) => void)|null = null;
    public err:((errCode:number) => void)|null = null;
    public rsp:engine.callback;
    public constructor(_cb_uuid:number, _entity:engine.subentity|engine.player) {
        this.entity = _entity
        this.rsp = new engine.callback(() => { return this.entity.del_callback(_cb_uuid); });
        this.entity.reg_hub_callback(_cb_uuid, this.rsp)

    }

    private on_rsp(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _player = common.protcol_to_player_info(inArray[0]);
        if (this.cb) this.cb.call(null, _player);

    }

    private on_err(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _errCode = inArray[0];
        if (this.err) this.err.call(null, _errCode)

    }

    public callBack(_cb:(player:common.player_info) => void, _err:(errCode:number) => void) {
        this.cb = _cb;
        this.err = _err;
        this.rsp.callback(this.on_rsp.bind(this), this.on_err.bind(this));
        return this.rsp;
    }

}

export class login_select_character_cb {
    public entity:engine.subentity|engine.player;
    public cb:((player:common.player_info) => void)|null = null;
    public err:((errCode:number) => void)|null = null;
    public rsp:engine.callback;
    public constructor(_cb_uuid:number, _entity:engine.subentity|engine.player) {
        this.entity = _entity
        this.rsp = new engine.callback(() => { return this.entity.del_callback(_cb_uuid); });
        this.entity.reg_hub_callback(_cb_uuid, this.rsp)

    }

    private on_rsp(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _player = common.protcol_to_player_info(inArray[0]);
        if (this.cb) this.cb.call(null, _player);

    }

    private on_err(bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _errCode = inArray[0];
        if (this.err) this.err.call(null, _errCode)

    }

    public callBack(_cb:(player:common.player_info) => void, _err:(errCode:number) => void) {
        this.cb = _cb;
        this.err = _err;
        this.rsp.callback(this.on_rsp.bind(this), this.on_err.bind(this));
        return this.rsp;
    }

}

export class login_caller {
    public entity:engine.subentity|engine.player;
    public constructor(entity:engine.subentity|engine.player) {
        this.entity = entity;
    }

    public  get_character(platform:em_platform, code:string) {
        let _argv_1bb5b9e8_2c5b_3c0e_a1df_9b01dff5f5f2:any[] = []
        _argv_1bb5b9e8_2c5b_3c0e_a1df_9b01dff5f5f2.push(platform);
        _argv_1bb5b9e8_2c5b_3c0e_a1df_9b01dff5f5f2.push(code);
        let _cb_uuid = this.entity.call_hub_request("get_character", encode(_argv_1bb5b9e8_2c5b_3c0e_a1df_9b01dff5f5f2));
        return new login_get_character_cb(_cb_uuid, this.entity);
    }

    public  create_character(player_nick_name:string, gender:number, scene:string) {
        let _argv_b09e2393_3876_3f7c_be40_cdd789a21e87:any[] = []
        _argv_b09e2393_3876_3f7c_be40_cdd789a21e87.push(player_nick_name);
        _argv_b09e2393_3876_3f7c_be40_cdd789a21e87.push(gender);
        _argv_b09e2393_3876_3f7c_be40_cdd789a21e87.push(scene);
        let _cb_uuid = this.entity.call_hub_request("create_character", encode(_argv_b09e2393_3876_3f7c_be40_cdd789a21e87));
        return new login_create_character_cb(_cb_uuid, this.entity);
    }

    public  select_character(player_id:string) {
        let _argv_6f89916d_93ec_3d09_b91d_511264985bc0:any[] = []
        _argv_6f89916d_93ec_3d09_b91d_511264985bc0.push(player_id);
        let _cb_uuid = this.entity.call_hub_request("select_character", encode(_argv_6f89916d_93ec_3d09_b91d_511264985bc0));
        return new login_select_character_cb(_cb_uuid, this.entity);
    }

}


