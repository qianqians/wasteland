import { Asset, assetManager, AssetManager, isValid } from 'cc';
import { Sleep } from '../Other/Sleep';

export class BundleManager
{
    private res:string="script/BundleManager/BundleManager.ts";
    private bundles:Map<string, AssetManager.Bundle> = new Map();
    private loadingBundles:Map<string, Promise<AssetManager.Bundle>> = new Map();
    private loadingAssets:Map<string, Promise<Asset>> = new Map();
    /** 已完成加载的 Asset 缓存，key 与 loadingAssets 相同 */
    private cachedAssets:Map<string, Asset> = new Map();

    public static _instance:BundleManager;
    static get Instance():BundleManager {
        if(this._instance==null)
            this._instance=new BundleManager();
        return this._instance;
    }
    
    private loadBundle(bundleRes:string) : Promise<AssetManager.Bundle> {
        let bundle = this.bundles.get(bundleRes);
        if (bundle) {
            return Promise.resolve(bundle);
        }

        let loadingBundle = this.loadingBundles.get(bundleRes);
        if (loadingBundle) {
            return loadingBundle;
        }

        loadingBundle = new Promise((resolve, reject) => {
            try {
                assetManager.loadBundle(bundleRes, (error,bundle) => {
                    if(error) {
                        console.warn(error.message);
                        this.loadingBundles.delete(bundleRes);
                        reject(error);
                    }
                    else if (!bundle) {
                        this.loadingBundles.delete(bundleRes);
                        reject(new Error(`loadBundle '${bundleRes}' returned empty bundle`));
                    }
                    else {
                        this.bundles.set(bundleRes, bundle);
                        this.loadingBundles.delete(bundleRes);
                        resolve(bundle);
                    }
                });
            }
            catch (err) {
                console.warn(this.res+"下的 loadAssets 错误:"+err);
                this.loadingBundles.delete(bundleRes);
                reject(err);
            }    
        });

        this.loadingBundles.set(bundleRes, loadingBundle);
        return loadingBundle;
    }

    public LoadAssetFromBundle<T extends Asset>(bundleRes:string, assetsRes:string, assetType:any) : Promise<T> {
        const cacheKey = `${bundleRes}/${assetsRes}/${assetType?.name ?? 'Asset'}`;

        // 命中已加载缓存，立即同步返回
        const cached = this.cachedAssets.get(cacheKey);
        if (cached && isValid(cached)) {
            return Promise.resolve(cached as T);
        }

        // 正在加载中，复用同一个 Promise
        const loadingAsset = this.loadingAssets.get(cacheKey);
        if (loadingAsset) {
            return loadingAsset as Promise<T>;
        }

        const promise = new Promise<T>(async (resolve, reject) => {
            try {
                let bundle = await this.loadBundle(bundleRes);

                bundle.load(assetsRes, assetType, (error, asset) => {
                    if(error) {
                        console.warn(`loadAssets '${bundleRes}' '${assetsRes}' error:`, error.message);
                        this.loadingAssets.delete(cacheKey);
                        reject(error);
                    }
                    else {
                        this.loadingAssets.delete(cacheKey);
                        this.cachedAssets.set(cacheKey, asset);
                        resolve(asset as T);
                    }
                });
            }
            catch (err) {
                console.error(this.res+"下的 loadAssetFromBundle 错误:"+err);
                this.loadingAssets.delete(cacheKey);
                reject(err);
            }
        });

        this.loadingAssets.set(cacheKey, promise as Promise<Asset>);
        return promise;
    }

    /**
     * 释放某个已缓存的 Asset（当页面长期不使用时可手动释放以节省内存）
     */
    public ReleaseAsset(bundleRes:string, assetsRes:string, assetType?:any) {
        const cacheKey = `${bundleRes}/${assetsRes}/${assetType?.name ?? 'Asset'}`;
        const asset = this.cachedAssets.get(cacheKey);
        if (asset) {
            this.cachedAssets.delete(cacheKey);
            const bundle = this.bundles.get(bundleRes);
            if (bundle) {
                bundle.release(assetsRes, assetType);
            }
        }
    }

    public LoadAssetsFromBundle(bundleRes:string, assetsRes:string) : Promise<Asset> {   
        return this.LoadAssetFromBundle<Asset>(bundleRes, assetsRes, Asset);
    }

    public LoadAssetsFromUrl(url:string, _ext:string) : Promise<Asset> {
        return new Promise((resolve, reject) => {
            try {
                assetManager.loadRemote(url, {ext:_ext}, (err:Error|null, asset:Asset) => {
                    if (err) {
                        console.log(err.message);
                        reject(err);
                    } 
                    else {
                        resolve(asset);
                    }
                });
            }
            catch (err) {
                console.warn(this.res+"下的 loadAssets 错误:"+err);
                reject(err);
            }    
        });
    }

    public PreLoadBundleDir(_bundle:string,_res:string,_callBack?:((bundleName:string,progress:number)=>void)|null, _complete?:(()=>void)|null) {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let bundle = await this.loadBundle(_bundle);
                let info = bundle.getDirWithPath(_res);
                if (info && info.length > 0) {
                    let n = 0;
                    for (let t of info) {
                        let uuid = t.uuid;
                        let cachedAsset = assetManager.assets.get(uuid)
                        if (cachedAsset && isValid(cachedAsset)) {
                            n++;
                        }
                    }
                    if (n == info.length) {
                        if (_callBack) {
                            await Sleep(333);
                            _callBack(_bundle, 100);
                        }
                        if(_complete) {
                            _complete();
                        }
                        resolve();
                        return;
                    }
                }

                bundle.preloadDir(_res, null, (finished, total, item) => {
                    if (_callBack) {
                        const progress = total > 0 ? Math.floor(finished / total * 100) : 100;
                        _callBack(_bundle, progress);
                    }
                }, (err, data) => {
                    if (err) {
                        console.warn("预下载 ",bundle,"/",_res," 错误 ",err);
                        reject(err);
                    }
                    else {
                        try {
                            if(_complete) {
                                _complete();
                            }
                            resolve();
                        }
                        catch (completeErr) {
                            reject(completeErr);
                        }
                    }
                });
            }
            catch (err) {
                console.warn("预下载 ",_bundle,"/",_res," 错误 ",err);
                reject(err);
            }
        })
    }
}
