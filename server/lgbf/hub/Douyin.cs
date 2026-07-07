using System.Collections;
using Newtonsoft.Json;

namespace hub
{
    namespace dy
    {
        public class Code2Session
        {
            [JsonProperty("error")] public long Error;
            [JsonProperty("session_key")] public required string SessionKey;
            [JsonProperty("openid")] public required string OpenId;
            [JsonProperty("anonymous_openid")] public required string AnonymousOpenId;
        }

        public class Code2SessionEx : System.Exception
        {
            [JsonProperty("error")] public long Error;
            [JsonProperty("errcode")] public long ErrCode;
            [JsonProperty("errmsg")] public required string ErrMsg;
            [JsonProperty("message")] public required string Message1;
        }

        public class DySdk
        {
            public static async ValueTask<Code2Session?> Code2Session(string appid, string secret, string code,
                string anonymousOpenId)
            {
                try
                {
                    string url = string.IsNullOrEmpty(anonymousOpenId)
                        ? $"https://minigame.zijieapi.com/mgplatform/api/apps/jscode2session?appid={appid}&secret={secret}&code={code}"
                        : $"https://minigame.zijieapi.com/mgplatform/api/apps/jscode2session?appid={appid}&secret={secret}&code={code}&anonymous_code={anonymousOpenId}";
                    Log.Trace("on_player_login:{0}", url);
                    var result = await HttpClientWrapper.GetRspAsync(url);
                    if (result.StatusCode == System.Net.HttpStatusCode.OK)
                    {
                        var ret = await result.Content.ReadAsStringAsync();
                        Log.Trace("jscode2session:{0}", ret);

                        var err = (long)0;
                        var jsonObj = Newtonsoft.Json.JsonConvert.DeserializeObject<Hashtable>(ret);
                        if (jsonObj != null && jsonObj.ContainsKey("error"))
                        {
                            var errObj = jsonObj["error"];
                            err = errObj != null ? (long)errObj : 0;
                        }

                        if (err == 0)
                        {
                            var retObj = Newtonsoft.Json.JsonConvert.DeserializeObject<Code2Session>(ret);
                            if (retObj != null)
                            {
                                retObj.OpenId = $"dy_{retObj.OpenId}";
                                retObj.AnonymousOpenId = $"dy_{retObj.AnonymousOpenId}";
                                return retObj;
                            }
                        }
                        else
                        {
                            var ex = Newtonsoft.Json.JsonConvert.DeserializeObject<Code2SessionEx>(ret);
                            if (ex != null)
                            {
                                throw ex;
                            }
                        }
                    }
                }
                catch (System.Exception ex)
                {
                    Log.Err($"{ex}");
                    throw;
                }

                return null;
            }
        }
    }
}