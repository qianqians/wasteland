
namespace hub;

public static class RedisHelp
{
    public static readonly string EntityLockKey = "EntityLock:{0}";
    
    public static readonly string EntityTokenConvertGuidKey = "EntityTokenGuid:{0}";
    
    public static readonly string EntityStoreKey = "EntityStore{0}:{1}";
    
    public static readonly string EntityTickFlagKey = "EntityTickFlag:{0}:{1}";

    public static readonly string EntityStoreMongodbList = "EntityStoreMongodbList";

    public static readonly string RankListKey = "RankList:{0}";

    public static readonly string RankListDataKey = "RankListData:{0}";
}
