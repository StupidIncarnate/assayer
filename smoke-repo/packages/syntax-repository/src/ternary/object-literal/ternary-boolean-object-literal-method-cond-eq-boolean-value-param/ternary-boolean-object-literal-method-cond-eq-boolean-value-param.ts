export const ternaryBooleanObjectLiteralMethodCondEqBooleanValueParam = {
    run(value: boolean): string {
        return value === false ? 'then' : 'else';
    },
};
