namespace hub;

public class EntityMgr
{
    private const int RetryDelayMs = 8;
    private const uint LockTimeoutMs = 10_000;
    private const int LockRenewIntervalMs = 3_000;

    private sealed record LockToken(string Key, string Token);

    private static async Task UnlockFunc(RedisHandle redis, List<LockToken> lockTokens)
    {
        foreach (var lockToken in lockTokens)
        {
            await redis.UnLock(lockToken.Key, lockToken.Token);
        }
        lockTokens.Clear();
    }

    private static async Task RenewLocks(RedisHandle redis, List<LockToken> lockTokens, CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(LockRenewIntervalMs, cancellationToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            foreach (var lockToken in lockTokens)
            {
                var renewed = await redis.LockExtend(lockToken.Key, lockToken.Token, LockTimeoutMs);
                if (!renewed)
                {
                    throw new InvalidOperationException($"lock renew failed: {lockToken.Key}");
                }
            }
        }
    }
    
    public async Task CallLockAndGetEntity(Context ctx, string[] entityIdes, Func<Entity, Entity[], Task> callback)
    {
        var redis = ctx.Redis ?? throw new InvalidOperationException("context redis is nil");
        var lockEntities = new SortedSet<string>(){ctx.Guid};
        foreach (var entity in entityIdes)
        {
            lockEntities.Add(entity);
        }

        var self = new Entity(ctx);
        var retryDelay = RetryDelayMs;

        ReTry:
        var lockTokens = new List<LockToken>(lockEntities.Count);
        try
        {
            foreach (var entityId in lockEntities)
            {
                var token = Guid.NewGuid().ToString();
                var lockKey = string.Format(RedisHelp.EntityLockKey, entityId);
                var lockSuccess = await redis.TryLock(lockKey, token, LockTimeoutMs);
                if (lockSuccess)
                {
                    lockTokens.Add(new LockToken(lockKey, token));
                }
                else
                {
                    break;
                }
            }

            if (lockTokens.Count != lockEntities.Count)
            {
                await UnlockFunc(redis, lockTokens);
                await Task.Delay(retryDelay);
                retryDelay = Math.Min(retryDelay * 2, 256);
                goto ReTry;
            }

            var entityMap = new Dictionary<string, Entity>(entityIdes.Length);
            foreach (var entityId in entityIdes)
            {
                if (!entityMap.ContainsKey(entityId))
                {
                    entityMap.Add(entityId, new Entity(ctx.From(entityId)));
                }
            }

            using var renewCts = new CancellationTokenSource();
            var renewTask = RenewLocks(redis, lockTokens, renewCts.Token);
            try
            {
                var entities = new List<Entity>(entityMap.Count);
                foreach (var entityId in entityIdes)
                {
                    if (entityMap.TryGetValue(entityId, out var entity))
                    {
                        entities.Add(entity);
                        entityMap.Remove(entityId);
                    }
                }

                await callback(self, entities.ToArray());
            }
            finally
            {
                await renewCts.CancelAsync();
                try
                {
                    await renewTask;
                }
                catch (OperationCanceledException ex)
                {
                    Log.Err("OperationCanceledException {0}", ex);
                    throw;
                }
            }
        }
        finally
        {
            await UnlockFunc(redis, lockTokens);
        }
    }
}
