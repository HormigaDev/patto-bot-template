/**
 * Tests unitarios para `CommandCategories`.
 *
 * El array es la fuente de verdad del comando `/help` para listar
 * categorías. Verifica que tenga nombre/descripción y que cada
 * categoría tenga un `tag` único.
 */

import { CommandCategories, Category } from '@/utils/CommandCategories';

describe('Utilidad CommandCategories', () => {
    describe('enum Category', () => {
        it('debería tener la etiqueta Info', () => {
            expect(Category.Info).toBe('info');
        });

        it('debería tener la etiqueta Other', () => {
            expect(Category.Other).toBe('other');
        });
    });

    describe('array CommandCategories', () => {
        it('debería tener al menos 2 categorías', () => {
            expect(CommandCategories.length).toBeGreaterThanOrEqual(2);
        });

        it('debería contener la categoría Info', () => {
            const infoCategory = CommandCategories.find((cat) => cat.tag === Category.Info);

            expect(infoCategory).toBeDefined();
            expect(infoCategory?.name).toBe('Información');
            expect(infoCategory?.description).toBe(
                'Comandos relacionados con la información del bot y del servidor.',
            );
            expect(infoCategory?.icon).toBe('ℹ️');
        });

        it('debería contener la categoría Other como respaldo', () => {
            const otherCategory = CommandCategories.find((cat) => cat.tag === Category.Other);

            expect(otherCategory).toBeDefined();
            expect(otherCategory?.name).toBe('Otros');
            expect(otherCategory?.icon).toBe('❓');
        });

        it('debería tener etiquetas únicas', () => {
            const tags = CommandCategories.map((cat) => cat.tag);
            const uniqueTags = new Set(tags);

            expect(tags.length).toBe(uniqueTags.size);
        });

        it('cada entrada debe tener nombre, descripción y tag válidos', () => {
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

    describe('búsqueda de categoría', () => {
        it('debería poder encontrar una categoría por etiqueta', () => {
            const category = CommandCategories.find((cat) => cat.tag === Category.Info);

            expect(category).toBeDefined();
        });

        it('debería retornar undefined para etiqueta inexistente', () => {
            const category = CommandCategories.find((cat) => cat.tag === ('non-existent' as any));

            expect(category).toBeUndefined();
        });
    });
});
