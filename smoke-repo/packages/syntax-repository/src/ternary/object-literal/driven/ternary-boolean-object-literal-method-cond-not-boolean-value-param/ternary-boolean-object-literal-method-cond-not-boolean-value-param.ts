export const ternaryBooleanObjectLiteralMethodCondNotBooleanValueParam = {
    run(value: boolean): string {
        return !value ? 'then' : 'else';
    },
};
