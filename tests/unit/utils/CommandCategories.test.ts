/**
 * Ejemplo de test unitario para CommandCategories utility
 */

import { CommandCategories, CommandCategoryTag } from '@/utils/CommandCategories';

describe('CommandCategories Utility', () => {
    describe('CommandCategoryTag enum', () => {
        it('should have Info tag', () => {
            expect(CommandCategoryTag.Info).toBe('info');
        });

        it('should have Other tag', () => {
            expect(CommandCategoryTag.Other).toBe('other');
        });
    });

    describe('CommandCategories array', () => {
        it('should have at least 2 categories', () => {
            expect(CommandCategories.length).toBeGreaterThanOrEqual(2);
        });

        it('should contain Info category', () => {
            const infoCategory = CommandCategories.find(
                (cat) => cat.tag === CommandCategoryTag.Info,
            );

            expect(infoCategory).toBeDefined();
            expect(infoCategory?.name).toBe('Información');
            expect(infoCategory?.icon).toBe('ℹ️');
        });

        it('should contain Other category as fallback', () => {
            const otherCategory = CommandCategories.find(
                (cat) => cat.tag === CommandCategoryTag.Other,
            );

            expect(otherCategory).toBeDefined();
            expect(otherCategory?.name).toBe('Otros');
            expect(otherCategory?.icon).toBe('❓');
        });

        it('should have unique tags', () => {
            const tags = CommandCategories.map((cat) => cat.tag);
            const uniqueTags = new Set(tags);

            expect(tags.length).toBe(uniqueTags.size);
        });

        it('should have all required properties', () => {
            CommandCategories.forEach((category) => {
                expect(category).toHaveProperty('name');
                expect(category).toHaveProperty('description');
                expect(category).toHaveProperty('tag');

                expect(typeof category.name).toBe('string');
                expect(typeof category.description).toBe('string');
                expect(typeof category.tag).toBe('string');

                // Icon es opcional pero si existe debe ser string
                if (category.icon) {
                    expect(typeof category.icon).toBe('string');
                }
            });
        });
    });

    describe('category lookup', () => {
        it('should be able to find category by tag', () => {
            const category = CommandCategories.find((cat) => cat.tag === CommandCategoryTag.Info);

            expect(category).toBeDefined();
        });

        it('should return undefined for non-existent tag', () => {
            const category = CommandCategories.find((cat) => cat.tag === ('non-existent' as any));

            expect(category).toBeUndefined();
        });
    });
});
