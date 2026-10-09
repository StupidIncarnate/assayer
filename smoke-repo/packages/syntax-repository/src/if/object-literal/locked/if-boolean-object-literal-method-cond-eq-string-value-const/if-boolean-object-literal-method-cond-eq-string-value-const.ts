const value: string = 'abc';

export const ifBooleanObjectLiteralMethodCondEqStringValueConst = {
    run(): string {
        if (value === 'xyz') {
            return 'then';
        }
        return 'else';
    },
};
