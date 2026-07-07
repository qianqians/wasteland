using System;
using System.Collections.Generic;

namespace hub;

public partial class TimerService
{
    private static long GetLoopDayMarker(DateTime time)
    {
        return time.Date.Ticks;
    }

    private static long GetLoopWeekMarker(DateTime time)
    {
        return time.Date.AddDays(-(int)time.DayOfWeek).Ticks;
    }

    private void RequeueLoopDayHandles()
    {
        foreach (var (key, item) in requeueLoopDayTimeHandles)
        {
            if (!loopDayTimeHandles.TryGetValue(key, out var impls))
            {
                impls = [];
                loopDayTimeHandles.Add(key, impls);
            }
            impls.AddRange(item);
        }
        requeueLoopDayTimeHandles.Clear();
    }

    private void RequeueLoopWeekDayHandles()
    {
        foreach (var (key, item) in requeueLoopWeekDayTimeHandles)
        {
            if (!loopWeekDayTimeHandles.TryGetValue(key, out var impls))
            {
                impls = [];
                loopWeekDayTimeHandles.Add(key, impls);
            }
            impls.AddRange(item);
        }
        requeueLoopWeekDayTimeHandles.Clear();
    }

    private void AddLoopDayTimeHandleImpl()
    {
        lock (pendingLoopDayTimeHandles)
        {
            foreach (var (key, item) in pendingLoopDayTimeHandles)
            {
                if (!loopDayTimeHandles.TryGetValue(key, out var impls))
                {
                    impls = [];
                    loopDayTimeHandles.Add(key, impls);
                }
                impls.AddRange(item);
            }
            pendingLoopDayTimeHandles.Clear();
        }
    }

    private void PollLoopDayTimeHandleImpl(long tick)
    {
        PollLoopDayTimeHandleImpl(tick, DateTime.Now, reschedule: true);
    }

    private void PollLoopDayTimeHandleImpl(long tick, DateTime time, bool reschedule)
    {
        try
        {
            AddLoopDayTimeHandleImpl();

            var marker = GetLoopDayMarker(time);
            if (loopDayTick != marker)
            {
                RequeueLoopDayHandles();
                loopDayTick = marker;
            }

            _dayTimeList.Clear();
            foreach (var (key, item) in loopDayTimeHandles)
            {
                if (key.Hour != time.Hour || key.Minute != time.Minute || key.Second > time.Second)
                {
                    continue;
                }
                _dayTimeList.Add(key);

                foreach (var impl in item)
                {
                    if (impl.IsDel)
                    {
                        continue;
                    }

                    var handle = impl.Handle as Action<DateTime>;
                    if (handle == null)
                    {
                        continue;
                    }
                    try
                    {
                        handle(time);
                    }
                    catch (Exception e)
                    {
                        Log.Err("System.Exception{0}", e);
                    }
                }
            }

            foreach (var item in _dayTimeList)
            {
                if (!requeueLoopDayTimeHandles.ContainsKey(item))
                {
                    requeueLoopDayTimeHandles.Add(item, new List<HandleImpl>());
                }
                foreach (var impl in loopDayTimeHandles[item])
                {
                    if (impl.IsDel)
                    {
                        continue;
                    }

                    requeueLoopDayTimeHandles[item].Add(impl);
                }
                loopDayTimeHandles.Remove(item);
            }
        }
        finally
        {
            if (reschedule)
            {
                AddTickTime(888, PollLoopDayTimeHandleImpl);
            }
        }
    }

    private void AddLoopWeekDayTimeHandleImpl()
    {
        lock (pendingLoopWeekDayTimeHandles)
        {
            foreach (var (key, item) in pendingLoopWeekDayTimeHandles)
            {
                if (!loopWeekDayTimeHandles.TryGetValue(key, out var impls))
                {
                    impls = [];
                    loopWeekDayTimeHandles.Add(key, impls);
                }
                impls.AddRange(item);
            }
            pendingLoopWeekDayTimeHandles.Clear();
        }
    }

    private void PollLoopWeekDayTimeHandleImpl(long tick)
    {
        PollLoopWeekDayTimeHandleImpl(tick, DateTime.Now, reschedule: true);
    }

    private void PollLoopWeekDayTimeHandleImpl(long tick, DateTime time, bool reschedule)
    {
        try
        {
            AddLoopWeekDayTimeHandleImpl();

            var marker = GetLoopWeekMarker(time);
            if (loopWeekDayTick != marker)
            {
                RequeueLoopWeekDayHandles();
                loopWeekDayTick = marker;
            }

            _weekDayTimeList.Clear();
            foreach (var (key, item) in loopWeekDayTimeHandles)
            {
                if (key.Day != time.DayOfWeek || key.Hour != time.Hour || key.Minute != time.Minute || key.Second > time.Second)
                {
                    continue;
                }
                _weekDayTimeList.Add(key);

                foreach (var impl in item)
                {
                    if (impl.IsDel)
                    {
                        continue;
                    }

                    var handle = impl.Handle as Action<DateTime>;
                    if (handle == null)
                    {
                        continue;
                    }
                    try
                    {
                        handle(time);
                    }
                    catch (Exception e)
                    {
                        Log.Err("System.Exception{0}", e);
                    }
                }
            }

            foreach (var item in _weekDayTimeList)
            {
                if (!requeueLoopWeekDayTimeHandles.TryGetValue(item, out var impls))
                {
                    impls = [];
                    requeueLoopWeekDayTimeHandles.Add(item, impls);
                }
                foreach (var impl in loopWeekDayTimeHandles[item])
                {
                    if (impl.IsDel)
                    {
                        continue;
                    }
                    impls.Add(impl);
                }
                loopWeekDayTimeHandles.Remove(item);
            }
        }
        finally
        {
            if (reschedule)
            {
                AddTickTime(888, PollLoopWeekDayTimeHandleImpl);
            }
        }
    }

    public object AddLoopDayTime(int hour, int minute, int second, Action<DateTime> handle)
    {
        var key = new DayTime
        {
            Hour = hour,
            Minute = minute,
            Second = second,
        };

        var impl = new HandleImpl(handle);
        lock (pendingLoopDayTimeHandles)
        {
            if (!pendingLoopDayTimeHandles.ContainsKey(key))
            {
                pendingLoopDayTimeHandles.Add(key, new List<HandleImpl>());
            }
            pendingLoopDayTimeHandles[key].Add(impl);
        }

        return impl;
    }

    public object AddLoopWeekDayTime(DayOfWeek day, int hour, int minute, int second, Action<DateTime> handle)
    {
        var key = new WeekDayTime
        {
            Day = day,
            Hour = hour,
            Minute = minute,
            Second = second,
        };

        var impl = new HandleImpl(handle);
        lock (pendingLoopWeekDayTimeHandles)
        {
            if (!pendingLoopWeekDayTimeHandles.ContainsKey(key))
            {
                pendingLoopWeekDayTimeHandles.Add(key, new List<HandleImpl>());
            }
            pendingLoopWeekDayTimeHandles[key].Add(impl);
        }

        return impl;
    }

    internal void PollLoopDayTimeForTest(DateTime time)
    {
        PollLoopDayTimeHandleImpl(0, time, reschedule: false);
    }

    internal void PollLoopWeekDayTimeForTest(DateTime time)
    {
        PollLoopWeekDayTimeHandleImpl(0, time, reschedule: false);
    }
}
