export const ifBooleanObjectLiteralMethodCondEqBooleanValueParam = {
    run(value: boolean): string {
        if (value === false) {
            return 'then';
        }
        return 'else';
    },
};
