export const ternaryBooleanObjectLiteralMethodCondEqStringValueParam = {
    run(value: string): string {
        return value === 'xyz' ? 'then' : 'else';
    },
};
