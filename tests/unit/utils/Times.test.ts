/**
 * Ejemplo de test unitario para utilidad Times
 */

import { Times } from '@/utils/Times';

describe('Utilidad Times', () => {
    describe('segundos', () => {
        it('debería convertir segundos a milisegundos', () => {
            expect(Times.seconds(1)).toBe(1000);
            expect(Times.seconds(5)).toBe(5000);
            expect(Times.seconds(60)).toBe(60000);
        });

        it('debería manejar cero segundos', () => {
            expect(Times.seconds(0)).toBe(0);
        });

        it('debería manejar segundos decimales', () => {
            expect(Times.seconds(0.5)).toBe(500);
            expect(Times.seconds(1.5)).toBe(1500);
        });
    });

    describe('minutos', () => {
        it('debería convertir minutos a milisegundos', () => {
            expect(Times.minutes(1)).toBe(60000);
            expect(Times.minutes(5)).toBe(300000);
            expect(Times.minutes(60)).toBe(3600000);
        });
    });

    describe('horas', () => {
        it('debería convertir horas a milisegundos', () => {
            expect(Times.hours(1)).toBe(3600000);
            expect(Times.hours(24)).toBe(86400000);
        });
    });

    describe('días', () => {
        it('debería convertir días a milisegundos', () => {
            expect(Times.days(1)).toBe(86400000);
            expect(Times.days(7)).toBe(604800000);
        });
    });

    describe('semanas', () => {
        it('debería convertir semanas a milisegundos', () => {
            expect(Times.weeks(1)).toBe(604800000);
            expect(Times.weeks(2)).toBe(1209600000);
        });
    });

    describe('meses', () => {
        it('debería convertir meses (30 días) a milisegundos', () => {
            expect(Times.months(1)).toBe(2592000000);
        });
    });

    describe('años', () => {
        it('debería convertir años (365 días) a milisegundos', () => {
            expect(Times.years(1)).toBe(31536000000);
        });
    });

    describe('operaciones combinadas', () => {
        it('debería permitir operaciones matemáticas', () => {
            const unaHoraTreintaMinutos = Times.hours(1) + Times.minutes(30);
            expect(unaHoraTreintaMinutos).toBe(5400000);
        });

        it('debería manejar cálculos de tiempo complejos', () => {
            const total = Times.days(1) + Times.hours(12) + Times.minutes(30);
            expect(total).toBe(131400000); // 1.5 días
        });
    });
});
