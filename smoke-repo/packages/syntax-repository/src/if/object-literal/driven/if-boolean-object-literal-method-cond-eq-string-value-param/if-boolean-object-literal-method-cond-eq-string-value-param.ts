export const ifBooleanObjectLiteralMethodCondEqStringValueParam = {
    run(value: string): string {
        if (value === 'xyz') {
            return 'then';
        }
        return 'else';
    },
};
