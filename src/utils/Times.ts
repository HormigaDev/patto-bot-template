export class Times {
    private static second = 1000;
    private static minute = this.second * 60;
    private static hour = this.minute * 60;
    private static day = this.hour * 24;
    private static week = this.day * 7;
    private static month = this.day * 30;
    private static year = this.day * 365;

    public static seconds(t: number) {
        return this.second * t;
    }
    public static minutes(t: number) {
        return this.minute * t;
    }
    public static hours(t: number) {
        return this.hour * t;
    }
    public static days(t: number) {
        return this.day * t;
    }
    public static weeks(t: number) {
        return this.week * t;
    }
    public static months(t: number) {
        return this.month * t;
    }
    public static years(t: number) {
        return this.year * t;
    }
}
