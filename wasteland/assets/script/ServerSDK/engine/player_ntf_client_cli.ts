import * as engine from "./engine";
import { encode, decode } from "./engine/@msgpack/msgpack";
import * as common from "./common_cli";
// this enum code is codegen by geese codegen for ts

// this struct code is codegen by geese codegen for ts
// this module code is codegen by geese codegen for typescript
export class player_ntf_client_module {
    public entity:engine.player;
    public on_drop:((s:engine.session, task_id:number, pkg_item:Array<common.item>, total_item:Array<common.item>) => void)[] = []
    public on_task:((s:engine.session, task_list:Array<common.task_info>, progress_list:Array<common.task_progress_info>) => void)[] = []
    public constructor(entity:engine.player) {
        this.entity = entity

        this.entity.reg_hub_notify_callback("drop", this.drop)
        this.entity.reg_hub_notify_callback("task", this.task)
    }

    public drop(hub_name:string, bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _task_id = inArray[0];
        let _pkg_item:Array<common.item> = [];
        for (let v_5441b1b9_4592_5e1c_94ba_124d9c6a6f94 of inArray[1]) {
            _pkg_item.push(common.protcol_to_item(v_5441b1b9_4592_5e1c_94ba_124d9c6a6f94))
        }
        let _total_item:Array<common.item> = [];
        for (let v_e22d0078_3b03_5fe2_a310_c3f6c3c23740 of inArray[2]) {
            _total_item.push(common.protcol_to_item(v_e22d0078_3b03_5fe2_a310_c3f6c3c23740))
        }
        let s = new engine.session(hub_name)
        for (let fn of this.on_drop) {
            fn(s, _task_id, _pkg_item, _total_item);
        }
    }

    public task(hub_name:string, bin:Uint8Array) {
        let inArray = decode(bin) as any;
        let _task_list:Array<common.task_info> = [];
        for (let v_944f018b_64ee_5e22_a445_39fa78b68397 of inArray[0]) {
            _task_list.push(common.protcol_to_task_info(v_944f018b_64ee_5e22_a445_39fa78b68397))
        }
        let _progress_list:Array<common.task_progress_info> = [];
        for (let v_553ebab7_911a_59be_9a8f_20354c69a863 of inArray[1]) {
            _progress_list.push(common.protcol_to_task_progress_info(v_553ebab7_911a_59be_9a8f_20354c69a863))
        }
        let s = new engine.session(hub_name)
        for (let fn of this.on_task) {
            fn(s, _task_list, _progress_list);
        }
    }

}


