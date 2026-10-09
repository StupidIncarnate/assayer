export const ternaryBooleanObjectLiteralMethodCondNotNumberValueParam = {
    run(value: number): string {
        return !value ? 'then' : 'else';
    },
};
