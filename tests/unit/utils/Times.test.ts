/**
 * Ejemplo de test unitario para Times utility
 */

import { Times } from '@/utils/Times';

describe('Times Utility', () => {
    describe('seconds', () => {
        it('should convert seconds to milliseconds', () => {
            expect(Times.seconds(1)).toBe(1000);
            expect(Times.seconds(5)).toBe(5000);
            expect(Times.seconds(60)).toBe(60000);
        });

        it('should handle zero seconds', () => {
            expect(Times.seconds(0)).toBe(0);
        });

        it('should handle decimal seconds', () => {
            expect(Times.seconds(0.5)).toBe(500);
            expect(Times.seconds(1.5)).toBe(1500);
        });
    });

    describe('minutes', () => {
        it('should convert minutes to milliseconds', () => {
            expect(Times.minutes(1)).toBe(60000);
            expect(Times.minutes(5)).toBe(300000);
            expect(Times.minutes(60)).toBe(3600000);
        });
    });

    describe('hours', () => {
        it('should convert hours to milliseconds', () => {
            expect(Times.hours(1)).toBe(3600000);
            expect(Times.hours(24)).toBe(86400000);
        });
    });

    describe('days', () => {
        it('should convert days to milliseconds', () => {
            expect(Times.days(1)).toBe(86400000);
            expect(Times.days(7)).toBe(604800000);
        });
    });

    describe('weeks', () => {
        it('should convert weeks to milliseconds', () => {
            expect(Times.weeks(1)).toBe(604800000);
            expect(Times.weeks(2)).toBe(1209600000);
        });
    });

    describe('months', () => {
        it('should convert months (30 days) to milliseconds', () => {
            expect(Times.months(1)).toBe(2592000000);
        });
    });

    describe('years', () => {
        it('should convert years (365 days) to milliseconds', () => {
            expect(Times.years(1)).toBe(31536000000);
        });
    });

    describe('combined operations', () => {
        it('should allow mathematical operations', () => {
            const oneHourThirtyMinutes = Times.hours(1) + Times.minutes(30);
            expect(oneHourThirtyMinutes).toBe(5400000);
        });

        it('should handle complex time calculations', () => {
            const total = Times.days(1) + Times.hours(12) + Times.minutes(30);
            expect(total).toBe(131400000); // 1.5 días
        });
    });
});
