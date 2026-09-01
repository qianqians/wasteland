import { Node, Prefab, Sprite, SpriteFrame, NodeEventType, Label, Button, RichText } from 'cc';
import { BundleManager } from '../tools/BundleManager/BundleManager'
import { em_player_appearance, em_role_gender } from '../ServerSDK/engine/common_cli';
import * as login_cli from '../ServerSDK/engine/login_cli'

export class CreateCharacter {
    private gender: em_role_gender = em_role_gender.em_role_gender_female;
    private appearance : em_player_appearance = em_player_appearance.em_player_appearance_female_1;
    private area: string = "";

    private selected_activate: SpriteFrame;
    private selected_normal: SpriteFrame;

    private sprite_frame: Sprite[];
    private sprite_avatar: Sprite[];
    private sprite_role: Sprite;
    private nick_name: RichText;
    private area_list: Label[];
    private gender_select_female: Sprite;
    private gender_select_male: Sprite;
    private enter_game: Sprite;

    public async Init(node:Node, login:login_cli.login_caller) {
        this.sprite_frame.push(node.getChildByPath("role0_sprite_frame").getComponent(Sprite));
        this.sprite_frame.push(node.getChildByPath("role1_sprite_frame").getComponent(Sprite));
        this.sprite_frame.push(node.getChildByPath("role2_sprite_frame").getComponent(Sprite));
        this.sprite_frame.push(node.getChildByPath("role3_sprite_frame").getComponent(Sprite));
        this.sprite_frame.push(node.getChildByPath("role4_sprite_frame").getComponent(Sprite));

        this.sprite_avatar.push(node.getChildByPath("role0_sprite_frame/role0_sprite_avatar").getComponent(Sprite));
        this.sprite_avatar.push(node.getChildByPath("role1_sprite_frame/role1_sprite_avatar").getComponent(Sprite));
        this.sprite_avatar.push(node.getChildByPath("role2_sprite_frame/role2_sprite_avatar").getComponent(Sprite));
        this.sprite_avatar.push(node.getChildByPath("role3_sprite_frame/role3_sprite_avatar").getComponent(Sprite));
        this.sprite_avatar.push(node.getChildByPath("role4_sprite_frame/role4_sprite_avatar").getComponent(Sprite));

        this.selected_activate = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", "UI_Select_Avatar_activate/spriteFrame", SpriteFrame);
        this.selected_normal = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", "UI_Select_Avatar_Normal/spriteFrame", SpriteFrame);
        for (let sp of this.sprite_frame) {
            sp.spriteFrame = this.selected_normal;
        }
        this.sprite_frame[this.appearance%5].spriteFrame = this.selected_activate;
        this.sprite_role = node.getChildByPath("role_sprite").getComponent(Sprite);

        for (let i = 0; i < this.sprite_avatar.length; i++) {
            this.sprite_avatar[i].node.on(NodeEventType.TOUCH_END, async () => {
                if (this.gender == em_role_gender.em_role_gender_female) {
                    this.sprite_frame[this.appearance%5].spriteFrame = this.selected_normal;
                    this.appearance = em_player_appearance.em_player_appearance_female_0 + i;
                    this.sprite_frame[this.appearance%5].spriteFrame = this.selected_activate;

                    this.sprite_role.spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", `UI_characters_Female_{i+1}/spriteFrame`, SpriteFrame);
                }
                else {                    
                    this.sprite_frame[this.appearance%5].spriteFrame = this.selected_normal;
                    this.appearance = em_player_appearance.em_player_appearance_male_0 + i;
                    this.sprite_frame[this.appearance%5].spriteFrame = this.selected_activate;

                    this.sprite_role.spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", `UI_characters_male_{i+1}/spriteFrame`, SpriteFrame);
                }
            });
        }

        this.area_list.push(node.getChildByPath("selection_region/area0").getComponent(Label));
        this.area_list.push(node.getChildByPath("selection_region/area1").getComponent(Label));
        this.area_list.push(node.getChildByPath("selection_region/area2").getComponent(Label));
        this.area_list.push(node.getChildByPath("selection_region/area3").getComponent(Label));
        this.area_list.push(node.getChildByPath("selection_region/area4").getComponent(Label));

        for (let n of this.area_list) {
            n.node.on(NodeEventType.TOUCH_END, () => {
                this.area = n.string;
            });
        }

        this.nick_name = node.getChildByPath("nick_name/text").getComponent(RichText);

        this.gender_select_female = node.getChildByPath("select_female").getComponent(Sprite);
        this.gender_select_female.node.on(NodeEventType.TOUCH_END, async () => {
            this.gender_select_male.spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", "UI_Select_Male_Normal/spriteFrame", SpriteFrame);
            this.gender_select_female.spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", "UI_Select_Fmale_activate/spriteFrame", SpriteFrame);
            this.InitGender(em_role_gender.em_role_gender_female);
        });
        this.gender_select_male = node.getChildByPath("select_male").getComponent(Sprite);
        this.gender_select_male.node.on(NodeEventType.TOUCH_END, async () => {
            this.gender_select_male.spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", "UI_Select_Male_activate/spriteFrame", SpriteFrame);
            this.gender_select_female.spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", "UI_Select_Fmale_Normal/spriteFrame", SpriteFrame);
            this.InitGender(em_role_gender.em_role_gender_male);
        });

        this.enter_game = node.getChildByPath("enter_game").getComponent(Sprite);
        this.enter_game.node.on(NodeEventType.TOUCH_END, () => {
            login.create_character(this.nick_name.string, this.gender, this.appearance, this.area).callBack(
                (info) => {
                    node.destroy();
                    console.log(`CreateCharacter login success:${info}`) 
                }, 
                (_err) => { 
                    console.log(`CreateCharacter login _err:${_err}`) 
                } 
            ).timeout(1000, () => {
                console.log(`CreateCharacter login timeout!`) 
            });
        });

        this.InitGender(this.gender);
    }

    public async InitGender(_gender: em_role_gender) {
        if (this.gender == _gender) {
            return;
        }
        this.gender = _gender;
        if (this.gender == em_role_gender.em_role_gender_female) {
            this.sprite_avatar[0].spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", "UI_characters_Female_1_head/spriteFrame", SpriteFrame);
            this.sprite_avatar[1].spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", "UI_characters_Female_2_head/spriteFrame", SpriteFrame);
            this.sprite_avatar[2].spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", "UI_characters_Female_3_head/spriteFrame", SpriteFrame);
            this.sprite_avatar[3].spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", "UI_characters_Female_4_head/spriteFrame", SpriteFrame);
            this.sprite_avatar[4].spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", "UI_characters_Female_5_head/spriteFrame", SpriteFrame);

            this.sprite_frame[this.appearance%5].spriteFrame = this.selected_normal;
            this.appearance = em_player_appearance.em_player_appearance_female_0;
            this.sprite_frame[this.appearance%5].spriteFrame = this.selected_activate;
            this.sprite_role.spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", `UI_characters_Female_1/spriteFrame`, SpriteFrame);
        }
        else if (this.gender == em_role_gender.em_role_gender_male) {
            this.sprite_avatar[0].spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", "UI_characters_male_1_head/spriteFrame", SpriteFrame);
            this.sprite_avatar[1].spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", "UI_characters_male_2_head/spriteFrame", SpriteFrame);
            this.sprite_avatar[2].spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", "UI_characters_male_3_head/spriteFrame", SpriteFrame);
            this.sprite_avatar[3].spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", "UI_characters_male_4_head/spriteFrame", SpriteFrame);
            this.sprite_avatar[4].spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", "UI_characters_male_5_head/spriteFrame", SpriteFrame);
            
            this.sprite_frame[this.appearance%5].spriteFrame = this.selected_normal;
            this.appearance = em_player_appearance.em_player_appearance_male_0;
            this.sprite_frame[this.appearance%5].spriteFrame = this.selected_activate;
            this.sprite_role.spriteFrame = await BundleManager.Instance.LoadAssetFromBundle2<SpriteFrame>("create_character", `UI_characters_male_1/spriteFrame`, SpriteFrame);
        }
    }
}