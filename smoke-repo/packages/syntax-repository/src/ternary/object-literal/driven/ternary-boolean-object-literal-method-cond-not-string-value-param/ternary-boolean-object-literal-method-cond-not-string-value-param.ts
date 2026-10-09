export const ternaryBooleanObjectLiteralMethodCondNotStringValueParam = {
    run(value: string): string {
        return !value ? 'then' : 'else';
    },
};
