using Google.Protobuf.Collections;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Buffers;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace hub;

public class HttpRsp(byte[]? data, int length, HttpResponse rsp)
{
    public byte[]? Data => data;
    public int Length => length;
    
    /*Microsoft.AspNetCore.Http.StatusCodes*/
    public ValueTask Response(int status, Dictionary<string, string> headers, byte[] buf) {
        try {
            foreach (var h in headers) {
                rsp.Headers[h.Key] = h.Value;
            }
            rsp.StatusCode = status;
            return rsp.Body.WriteAsync(buf);

        } catch (Exception ex) {
            Log.Err("Response Exception:{0}", ex);
        } finally {
        }
        return ValueTask.CompletedTask;
    }
}

public class Startup {
    private static readonly byte[] EmptyBody = [];
    private static readonly double TickToMilliseconds = 1000.0 / Stopwatch.Frequency;

    public void ConfigureServices(IServiceCollection services) {
    }

    private static int _lCount = 0;
    private static long _receiveStatTick = Stopwatch.GetTimestamp() + Stopwatch.Frequency;
    private static long _lastStatTick = Stopwatch.GetTimestamp();
    public void Configure(IApplicationBuilder app) {
        app.Run(async (context) =>
        {
            var begin = Stopwatch.GetTimestamp();

            var now = Stopwatch.GetTimestamp();
            if (now >= Volatile.Read(ref _receiveStatTick)) {
                var count = Interlocked.Exchange(ref _lCount, 0);
                var elapsed = (now - Volatile.Read(ref _lastStatTick)) * TickToMilliseconds;
                Log.Info("Connect statistics: {0} messages in {1} ms", count, (long)elapsed);
                Volatile.Write(ref _lastStatTick, now);
                Volatile.Write(ref _receiveStatTick, now + Stopwatch.Frequency);
            }
            
            var segments = context.Request.Path.Value!.TrimStart('/').Split('/');
            var endpoint = segments.Length > 0 ? segments[0] : "unknown";

            Func<HttpRsp, Task>? cb = null;
            if (context.Request.Method == HttpMethods.Post)
            {
                HttpService.TryGetPostCallback(endpoint, out cb);
            }
            else if (context.Request.Method == HttpMethods.Options)
            {
                foreach (var h in HttpService.BuildCrossHeaders())
                {
                    context.Response.Headers[h.Key] = h.Value;
                }
                context.Response.StatusCode = StatusCodes.Status200OK;
                await context.Response.Body.WriteAsync(EmptyBody);
                return;
            }
            if (cb == null) {
                return;
            }

            byte[]? buf = null;
            var bodyLength = 0;
            try {
                if (context.Request.ContentLength != null) {
                    var length = (int)context.Request.ContentLength;
                    buf = ArrayPool<byte>.Shared.Rent(length);
                    while (bodyLength < length) {
                        var len = await context.Request.Body.ReadAsync(buf.AsMemory(bodyLength, length - bodyLength));
                        if (len <= 0) {
                            break;
                        }
                        bodyLength += len;
                    }
                }
                await cb(new HttpRsp(buf, bodyLength, context.Response));
            } catch (Exception ex) {
                Log.Err("process http req ex:{0}", ex);
            } finally {
                if (buf != null) {
                    ArrayPool<byte>.Shared.Return(buf);
                }

                var elapsed = (Stopwatch.GetTimestamp() - begin) * TickToMilliseconds;
                if (elapsed > 1000) {
                    Log.Err("Timeout: elapsed_ticks={0}", (long)elapsed);
                }
            }
        });
    }
}

public class HttpService
{
    private static readonly Dictionary<string, Func<HttpRsp, Task>> PostCb = new();

    private readonly int _port;
    private IHost? _h;

    public HttpService(string host, int port)
    {
        _port = port;
    }

    private static readonly Dictionary<string, string>  Headers = new Dictionary<string, string> { 
        { "Content-Type", "application/json; charset=utf-8" },
        { "Access-Control-Allow-Origin", "*" }, {"Access-Control-Allow-Headers", "XL-Token, Content-Type" },
        { "Access-Control-Allow-Methods", "POST, GET, OPTIONS"} 
    };
    public static Dictionary<string, string> BuildCrossHeaders()
    {
        return Headers;
    }
    
    public static void Post(string uri, Func<HttpRsp, Task> callback)
    {
        PostCb.Add(uri, callback);
    }

    public static bool TryGetPostCallback(string uri, out Func<HttpRsp, Task>? cb)
    {
        return PostCb.TryGetValue(uri, out cb);
    }

    private void RunServerAsync()
    {
        var hostBuilder = new HostBuilder().ConfigureWebHostDefaults((webHostBuilder) => {
            webHostBuilder
                .UseKestrel()
                .ConfigureKestrel((context, options) => {
                    options.Limits.MaxConcurrentConnections = 16_384;
                    options.Limits.KeepAliveTimeout = TimeSpan.FromSeconds(120);

                    options.ListenAnyIP(_port, (listenOptions) => {
                        listenOptions.Protocols = HttpProtocols.Http1AndHttp2;
                    });

                })
                .UseContentRoot(Directory.GetCurrentDirectory())
                .UseStartup<Startup>();
        });

        _h = hostBuilder.Build();
        _h.Run();
    }

    public void Run() {
        _ = Task.Factory.StartNew(RunServerAsync, TaskCreationOptions.LongRunning);
    }

    public async Task Close() {
        if (_h != null)
        {
            await _h.StopAsync();
        }
    }
}
