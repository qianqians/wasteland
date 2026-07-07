
namespace hub;

public sealed class HttpClientWrapper
{
    static readonly HttpClient Client = new HttpClient();
    public static void Init()
    {
        Client.Timeout = TimeSpan.FromSeconds(3);
    }

    public static async ValueTask<HttpResponseMessage> PostAsync(string url, HttpContent content)
    {
        try
        {
            HttpResponseMessage response = await Client.PostAsync(url, content);
            response.EnsureSuccessStatusCode();
            return response;
        }
        catch (HttpRequestException e)
        {
            Log.Err("HttpClientWrapper.PostAsync url: {0} error: {1}", url, e);
            throw;
        }
    }

    public static async ValueTask<HttpResponseMessage> GetRspAsync(string url, List<KeyValuePair<string, string>>? headers = null)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            if (headers != null)
            {
                foreach (var header in headers)
                {
                    request.Headers.Add(header.Key, header.Value);
                }
            }
            HttpResponseMessage response = await Client.SendAsync(request);
            return response;
        }
        catch (HttpRequestException e)
        {
            Log.Err("HttpClientWrapper.GetRspAsync url: {0} error: {1}", url, e);
            throw;
        }
    }
}