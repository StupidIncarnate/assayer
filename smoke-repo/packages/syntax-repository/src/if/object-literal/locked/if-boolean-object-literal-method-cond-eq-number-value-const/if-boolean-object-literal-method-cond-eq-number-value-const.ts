const value: number = 3;

export const ifBooleanObjectLiteralMethodCondEqNumberValueConst = {
    run(): string {
        if (value === 7) {
            return 'then';
        }
        return 'else';
    },
};
