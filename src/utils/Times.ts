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

export class CustomDate extends Date {
    public toDiscordTimestamp(format: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R' = 'R'): string {
        const unixTimestamp = Math.floor(this.getTime() / 1000);
        return `<t:${unixTimestamp}:${format}>`;
    }

    public static fromDiscordTimestamp(discordTimestamp: string): CustomDate {
        const regex = /<t:(\d+)(?::[tTdDfFR])?>/;
        const match = discordTimestamp.match(regex);
        if (!match) {
            throw new Error('Invalid Discord timestamp format');
        }
        const unixTimestamp = parseInt(match[1], 10) * 1000;
        return new CustomDate(unixTimestamp);
    }
}
