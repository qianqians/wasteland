using System;

namespace hub;

public partial class TimerService
{
    private void AddTickHandleImpl()
    {
        lock (addTickHandle)
        {
            if (addTickHandle.Count <= 0)
            {
                return;
            }

            foreach (var item in addTickHandle)
            {
                var process = item.Key;
                while (tickHandleDict.ContainsKey(process))
                {
                    process++;
                }

                tickHandleDict.Add(process, item.Value);
            }

            addTickHandle.Clear();
        }
    }

    private void PollTickHandleImpl()
    {
        AddTickHandleImpl();

        foreach (var (key, impl) in tickHandleDict)
        {
            if (key <= Tick)
            {
                _list.Add(key);
                if (impl.IsDel)
                {
                    continue;
                }

                var handle = impl.Handle as Action<long>;
                if (handle == null)
                {
                    continue;
                }

                try
                {
                    handle(Tick);
                }
                catch (Exception e)
                {
                    Log.Err("System.Exceptio{0}", e);
                }
            }
            else
            {
                break;
            }
        }

        if (_list.Count <= 0)
        {
            return;
        }

        foreach (var item in _list)
        {
            tickHandleDict.Remove(item);
        }
        _list.Clear();
    }

    public object AddTickTime(long process, Action<long> handle)
    {
        process += Tick;
        var impl = new HandleImpl(handle);

        lock (addTickHandle)
        {
            while (addTickHandle.ContainsKey(process))
            {
                process++;
            }
            addTickHandle.Add(process, impl);
        }

        return impl;
    }

    public void DelTimer(object impl)
    {
        var handle = impl as HandleImpl;
        if (handle != null)
        {
            handle.IsDel = true;
        }
    }
}
