export const ternaryBooleanObjectLiteralMethodCondNullishBooleanValueParam = {
    run(value: boolean | undefined): string {
        return value ?? false ? 'then' : 'else';
    },
};
