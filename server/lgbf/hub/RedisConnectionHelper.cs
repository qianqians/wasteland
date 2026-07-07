using System.Globalization;
using StackExchange.Redis;

namespace hub;

public class RedisConnectionHelper
{
    private static readonly int RecoverRetry = 5;
    private static readonly int ConnectRetry = 3;
    private static readonly int ConnectTimeout = 5000;
    private static readonly int KeepAlive = 30;
    private readonly ManualResetEvent _waitNotify = new ManualResetEvent(false);

    private readonly int _waitTimeout = 15000; //15s
    private readonly string _conUrl;
    private readonly string _conName;
    private readonly string _pwd;
    private readonly string _conf;
    private readonly int _db;
    private readonly int _recoverRetryDelayMs = 200;
    private int _recoverCnt = 0;
    private int _inRecover = 0;
    private int _lastRecoverSucceeded = 1;


    public RedisConnectionHelper(string conUrl, string conName, string pwd, int db = 0)
    {
        _conUrl = conUrl;
        _conName = conName;
        _pwd = pwd;
        _db = db;
        _conf = BuildConfig(conUrl, conName);
    }

    public void ConnectOnStartup(ref ConnectionMultiplexer? connectionMultiplexer, ref IDatabase? database, ref ISubscriber? subscriber)
    {
        try
        {
            if (connectionMultiplexer != null)
            {
                connectionMultiplexer.Close(allowCommandsToComplete: false);
            }
            
            connectionMultiplexer = ConnectionMultiplexer.Connect(_conf);
            database = connectionMultiplexer.GetDatabase(_db);
            subscriber = connectionMultiplexer.GetSubscriber();
        }
        catch (StackExchange.Redis.RedisConnectionException ex)
        {
            Log.Err("Can NOT connect to Redis! connectRetry={0}, connectTimeout={1}ms, conex:{2}, _conf:{3}", 
                ConnectRetry, ConnectTimeout, ex, _conf);
            throw;
        }
    }

    public void Recover(ref ConnectionMultiplexer connectionMultiplexer, ref IDatabase database, ref ISubscriber? subscriber, Exception e, Action? afterRecover = null)
    {
        if (Interlocked.CompareExchange(ref _inRecover, 1, 0) == 0)
        {
            Log.Err("Redis Exception: {0}", e);
            Log.Info("Reconnect for {0}, count={1}", _conName, ++_recoverCnt);
            try
            {
                Volatile.Write(ref _lastRecoverSucceeded, 0);
                connectionMultiplexer.Close(allowCommandsToComplete: false);

                var delay = _recoverRetryDelayMs;
                for (var i = 0; i < RecoverRetry; i++)
                {
                    try
                    {
                        connectionMultiplexer = ConnectionMultiplexer.Connect(_conf);
                        database = connectionMultiplexer.GetDatabase(_db);
                        subscriber = connectionMultiplexer.GetSubscriber();
                        Volatile.Write(ref _lastRecoverSucceeded, 1);
                        break;
                    }
                    catch (StackExchange.Redis.RedisConnectionException ex)
                    {
                        Log.Warn("Recover retry failed for {0}, attempt={1}, ex={2}", _conName, i + 1, ex.Message);
                        Thread.Sleep(delay);
                        delay = Math.Min(delay * 2, 2000);
                    }
                }

                if (Volatile.Read(ref _lastRecoverSucceeded) != 1)
                {
                    throw new StackExchange.Redis.RedisConnectionException(ConnectionFailureType.UnableToResolvePhysicalConnection, "Redis recover failed");
                }

                afterRecover?.Invoke();
            }
            catch (StackExchange.Redis.RedisConnectionException ex)
            {
                Volatile.Write(ref _lastRecoverSucceeded, -1);
                Log.Err("Recover failed! RecoverCount={0}, connectRetry={1}, connectTimeout={2}ms, _conf={3}", 
                    _recoverCnt, ConnectRetry, ConnectTimeout, _conf);
                throw new InvalidOperationException("Redis recover failed", ex);
            }
            finally
            {
                _inRecover = 0;
                if (!_waitNotify.Set())
                {
                    Log.Err("_waitNotify.Set() failed");
                }
                Thread.Sleep(10);
                if (!_waitNotify.Reset())
                {
                    Log.Err("_waitNotify.ReSet() failed");
                }
            }
        }
        else
        {
            if (!_waitNotify.WaitOne(_waitTimeout))
            {
                var msg = $"_waitNotifyTimeout after {_waitTimeout}ms";
                throw new TimeoutException(msg);
            }

            if (Volatile.Read(ref _lastRecoverSucceeded) != 1)
            {
                throw new InvalidOperationException("Redis recover failed");
            }
        }
    }


    string BuildConfig(string conUrl, string conName)
    {
        Span<char> buf = stackalloc char[512];
        if (string.IsNullOrEmpty(_pwd))
        {
            return string.Create(CultureInfo.InvariantCulture, buf, $"{conUrl}, " + 
                $"connectRetry={ConnectRetry},connectTimeout={ConnectTimeout}," +
                $"keepAlive={KeepAlive},resolveDns={true},name={conName}");
        }
        return string.Create(CultureInfo.InvariantCulture, buf, $"{conUrl}," +
            $"password={_pwd},connectRetry={ConnectRetry},connectTimeout={ConnectTimeout}," +
            $"keepAlive={KeepAlive},resolveDns={true},name={conName}");
    }
}
