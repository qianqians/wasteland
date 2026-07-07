using System.Text;
using Google.Protobuf;

namespace hub;

public class WRpc
{
    private static readonly ByteString OkContent = ByteString.CopyFromUtf8("OK");

    private delegate Task RpcHandler(HttpRsp rsp, string avatarId, ByteString data);

    private readonly Dictionary<string, RpcHandler> _callbackNtf = new();

    public WRpc(string uri)
    {
        HttpService.Post(uri, async (rsp) =>
        {
            try
            {
                if (rsp.Data == null || rsp.Length <= 0)
                {
                    throw new Exception("rpc request failed! empty body");
                }

                var req = Request.Parser.ParseFrom(rsp.Data, 0, rsp.Length);
                if (!_callbackNtf.TryGetValue(req.ProtoName, out var callback))
                {
                    throw new Exception($"rpc request failed! unknown proto: {req.ProtoName}");
                }

                var avatarId = await Main.Redis!.GetData(string.Format(RedisHelp.EntityTokenConvertGuidKey, req.Token));
                if (avatarId == null)
                {
                    throw new Exception("rpc request failed! wrong avatarId is nil!");
                }

                await callback(rsp, Encoding.UTF8.GetString(avatarId), req.Content);
            }
            catch (Exception ex)
            {
                Log.Err("rpc request failed! {0}", ex);
                throw;
            }
        });
    }

    public void RegisterNtf<T>(string method, Action<Context, T> callback) where T : IMessage<T>, new()
    {
        var parser = new MessageParser<T>(() => new T());
        _callbackNtf.Add(method, async (HttpRsp rsp, string avatarId, ByteString data) =>
        {
            var r = new Response();
            try
            {
                var t = parser.ParseFrom(data);
                callback(Context.New(avatarId), t);

                r.ErrMsg = "OK";
                r.Content = OkContent;
            }
            catch (Exception ex)
            {
                r.ErrMsg = "error";
                r.Content = ByteString.CopyFromUtf8(ex.Message);
            }
            finally
            {
                await rsp.Response(Microsoft.AspNetCore.Http.StatusCodes.Status200OK, HttpService.BuildCrossHeaders(), r.ToByteArray());
            }
        });
    }

    public void RegisterAsyncNtf<T>(string method, Func<Context, T, Task> callback) where T : IMessage<T>, new()
    {
        var parser = new MessageParser<T>(() => new T());
        _callbackNtf.Add(method, async (HttpRsp rsp, string avatarId, ByteString data) =>
        {
            var r = new Response();
            try
            {
                var t = parser.ParseFrom(data);
                await callback(Context.New(avatarId), t);

                r.ErrMsg = "OK";
                r.Content = OkContent;
            }
            catch (Exception ex)
            {
                r.ErrMsg = "error";
                r.Content = ByteString.CopyFromUtf8(ex.Message);
            }
            finally
            {
                await rsp.Response(Microsoft.AspNetCore.Http.StatusCodes.Status200OK, HttpService.BuildCrossHeaders(), r.ToByteArray());
            }
        });
    }

    public void RegisterRequest<T1, T2>(string method, Func<Context, T1, T2> callback)
        where T1 : IMessage<T1>, new()
        where T2 : IMessage<T2>, new()
    {
        var parser1 = new MessageParser<T1>(() => new T1());
        _callbackNtf.Add(method, async (HttpRsp rsp, string avatarId, ByteString data) =>
        {
            var r = new Response();
            try
            {
                var t = parser1.ParseFrom(data);
                var back = callback(Context.New(avatarId), t);

                r.ErrMsg = "OK";
                r.Content = back.ToByteString();
            }
            catch (Exception ex)
            {
                r.ErrMsg = "error";
                r.Content = ByteString.CopyFromUtf8(ex.Message);
            }
            finally
            {
                await rsp.Response(Microsoft.AspNetCore.Http.StatusCodes.Status200OK, HttpService.BuildCrossHeaders(), r.ToByteArray());
            }
        });
    }

    public void RegisterAsyncRequest<T1, T2>(string method, Func<Context, T1, Task<T2>> callback)
        where T1 : IMessage<T1>, new()
        where T2 : IMessage<T2>, new()
    {
        var parser1 = new MessageParser<T1>(() => new T1());
        _callbackNtf.Add(method, async (HttpRsp rsp, string avatarId, ByteString data) =>
        {
            var r = new Response();
            try
            {
                var t = parser1.ParseFrom(data);
                var back = await callback(Context.New(avatarId), t);

                r.ErrMsg = "OK";
                r.Content = back.ToByteString();
            }
            catch (Exception ex)
            {
                r.ErrMsg = "error";
                r.Content = ByteString.CopyFromUtf8(ex.Message);
            }
            finally
            {
                await rsp.Response(Microsoft.AspNetCore.Http.StatusCodes.Status200OK, HttpService.BuildCrossHeaders(), r.ToByteArray());
            }
        });
    }
}
