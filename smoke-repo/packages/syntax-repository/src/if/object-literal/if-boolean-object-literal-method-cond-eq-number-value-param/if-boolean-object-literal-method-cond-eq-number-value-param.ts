export const ifBooleanObjectLiteralMethodCondEqNumberValueParam = {
    run(value: number): string {
        if (value === 7) {
            return 'then';
        }
        return 'else';
    },
};
