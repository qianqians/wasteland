using hub;

namespace wasteland
{
    class Program
    {
        private static void UnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            Exception? ex = e.ExceptionObject as Exception;
            if (ex != null)
            {
                Log.Err("unhandle exception:{0}", ex.ToString());
            }
        }

        static async Task Main(string[] args)
        {
            AppDomain.CurrentDomain.UnhandledException += UnhandledException;

            Console.CancelKeyPress += async (sender, e) =>
            {
                Log.Info("CancelKeyPress Cancel ProcessExit!");
                e.Cancel = true;
                await hub.Main.WaitClose();
            };

            AppDomain.CurrentDomain.ProcessExit += async (sender, e) =>
            {
                Log.Info("System Cancel ProcessExit");
                await hub.Main.WaitClose();
            };

            FileStream fs = File.OpenRead(args[0]);
            byte[] data = new byte[fs.Length];
            int offset = 0;
            int remaining = data.Length;
            while (remaining > 0)
            {
                int read = fs.Read(data, offset, remaining);
                if (read <= 0)
                {
                    throw new EndOfStreamException("file read at" + read.ToString() + " failed");
                }
                remaining -= read;
                offset += read;
            }
            var cfg = Newtonsoft.Json.JsonConvert.DeserializeObject<Config>(System.Text.Encoding.Default.GetString(data));
            if (cfg != null)
            {
                await hub.Main.Start(cfg);
            }
        }
    }
}