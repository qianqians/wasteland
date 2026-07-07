using System;

namespace hub;

public partial class TimerService
{
    private struct MonthDayTime : IEquatable<MonthDayTime>
    {
        public int Month;
        public int Day;
        public int Hour;
        public int Minute;
        public int Second;

        public override int GetHashCode()
        {
            return Day * 24 * 3600 + Hour * 3600 + Minute * 60 + Second;
        }

        public bool Equals(MonthDayTime tmp)
        {
            return Month == tmp.Month && Day == tmp.Day && Hour == tmp.Hour && Minute == tmp.Minute && Second == tmp.Second;
        }

        public override bool Equals(object? obj)
        {
            return obj is MonthDayTime other && Equals(other);
        }
    }

    private struct WeekDayTime : IEquatable<WeekDayTime>
    {
        public DayOfWeek Day;
        public int Hour;
        public int Minute;
        public int Second;

        public override int GetHashCode()
        {
            return (int)Day * 24 * 3600 + Hour * 3600 + Minute * 60 + Second;
        }

        public bool Equals(WeekDayTime tmp)
        {
            return Day == tmp.Day && Hour == tmp.Hour && Minute == tmp.Minute && Second == tmp.Second;
        }

        public override bool Equals(object? obj)
        {
            return obj is WeekDayTime other && Equals(other);
        }
    }

    private struct DayTime : IEquatable<DayTime>
    {
        public int Hour;
        public int Minute;
        public int Second;

        public override int GetHashCode()
        {
            return Hour * 3600 + Minute * 60 + Second;
        }

        public bool Equals(DayTime tmp)
        {
            return Hour == tmp.Hour && Minute == tmp.Minute && Second == tmp.Second;
        }

        public override bool Equals(object? obj)
        {
            return obj is DayTime other && Equals(other);
        }
    }
}
