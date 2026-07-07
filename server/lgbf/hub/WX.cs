using System.Threading.Tasks;
using Newtonsoft.Json;

namespace hub
{
    namespace wx
    {
        public class Code2Session
        {
            [JsonProperty("openid")] public required string OpenId;
            [JsonProperty("session_key")] public required string SessionKey;
            [JsonProperty("unionid")] public required string Unionid;
            [JsonProperty("errcode")] public required int ErrCode;
            [JsonProperty("errmsg")] public required string ErrMsg;
        }

        public class WxSdk
        {
            public static async ValueTask<Code2Session?> Code2Session(string appid, string secret, string code)
            {
                try
                {
                    var url = $"https://api.weixin.qq.com/sns/jscode2session?" +
                              $"appid={appid}&secret={secret}&js_code={code}&grant_type=authorization_code";
                    Log.Trace("on_player_login:{0}", url);
                    var result = await HttpClientWrapper.GetRspAsync(url);
                    if (result.StatusCode == System.Net.HttpStatusCode.OK)
                    {
                        var ret = await result.Content.ReadAsStringAsync();
                        Log.Trace("jscode2session:{0}", ret);
                        var retObj = Newtonsoft.Json.JsonConvert.DeserializeObject<Code2Session>(ret);
                        retObj?.OpenId = $"wx_{retObj.OpenId}";
                        return retObj;
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
