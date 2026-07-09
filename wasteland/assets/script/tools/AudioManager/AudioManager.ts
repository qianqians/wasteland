/*
 * 新建 AudioManager.ts
 * author: Hotaru
 * 2024/04/06
 */
import { AudioClip, AudioSource, director, Node, isValid } from 'cc';
import { BundleManager } from '../BundleManager/BundleManager';

export class AudioManager
{
    private static instance:AudioManager|null = null;
    private static readonly audioNodeName = '__audioMgr__';
    private audioSource:AudioSource|null = null;
    private static readonly audioClips:Map<string, AudioClip> = new Map();
    private static readonly loadingAudioClips:Map<string, Promise<AudioClip>> = new Map();

    public Init(_parent?:Node) {
        if (this.audioSource && isValid(this.audioSource.node)) {
            return;
        }

        const scene = director.getScene();
        if (!scene) {
            throw new Error('AudioManager.Init failed: scene is unavailable');
        }

        let audioMgr = scene.getChildByName(AudioManager.audioNodeName);
        if (!audioMgr || !isValid(audioMgr)) {
            audioMgr = new Node();
            audioMgr.name = AudioManager.audioNodeName;
            scene.addChild(audioMgr);
            director.addPersistRootNode(audioMgr);
        }

        this.audioSource = audioMgr.getComponent(AudioSource) ?? audioMgr.addComponent(AudioSource);
    }
    
    public static get Instance() {
        if(null == this.instance) {
            this.instance=new AudioManager();
        }
        return this.instance;
    }

    public get AudioSource() {
        return this.audioSource;
    }

    public async PlaySound(sound: AudioClip | string, volume: number = 1.0) {
        return this.PlayMusic(sound, volume);
    }

    public async PlayMusic(sound: AudioClip | string, volume: number = 1.0) {
        try {
            let clip = sound instanceof AudioClip ? sound : await this.FoundClips(sound);
            if (this.audioSource != null && clip != null) {
                this.audioSource.stop();
                this.audioSource.clip = clip;
                this.audioSource.volume = volume;
                this.audioSource.play();
            }
        }
       catch(error) {
            console.error('AudioManager 下 PlayMusic 错误 err: ',error);
       }
    }

    public async PlayerOnShot(sound: AudioClip | string, volume: number = 1.0) {
        return this.PlaySfx(sound, volume);
    }

    public async PlaySfx(sound: AudioClip | string, volume: number = 1.0) {
        try {
            let clip = sound instanceof AudioClip ? sound : await this.FoundClips(sound);
            if (this.audioSource != null && clip != null) {
                this.audioSource.playOneShot(clip, volume);
            }
        }
        catch(error) {
            console.error('AudioManager 下 PlaySfx 错误 err: ',error);
        }
    }

    public Stop() {
        this.audioSource?.stop();
    }

    public StopMusic() {
        this.Stop();
    }

    public Pause() {
        this.audioSource?.pause();
    }

    public Resume() {
        this.audioSource?.play();
    }

    private ParseClipPath(resource:string) {
        const splitIndex = resource.indexOf('/');
        if (splitIndex <= 0 || splitIndex >= resource.length - 1) {
            throw new Error(`AudioManager.FoundClips invalid resource path: ${resource}`);
        }

        return {
            bundleName: resource.slice(0, splitIndex),
            assetPath: resource.slice(splitIndex + 1),
            cacheKey: resource,
        };
    }

    private async FoundClips(_name:string) {
        const { bundleName, assetPath, cacheKey } = this.ParseClipPath(_name);
        const cachedClip = AudioManager.audioClips.get(cacheKey);
        if (cachedClip && isValid(cachedClip)) {
            return cachedClip;
        }

        let loadingClip = AudioManager.loadingAudioClips.get(cacheKey);
        if (loadingClip) {
            return loadingClip;
        }

        loadingClip = BundleManager.Instance
            .LoadAssetFromBundle<AudioClip>(bundleName, assetPath, AudioClip)
            .then((clip) => {
                AudioManager.audioClips.set(cacheKey, clip);
                AudioManager.loadingAudioClips.delete(cacheKey);
                return clip;
            })
            .catch((err) => {
                AudioManager.loadingAudioClips.delete(cacheKey);
                throw err;
            });

        AudioManager.loadingAudioClips.set(cacheKey, loadingClip);
        return loadingClip;
    }
}
