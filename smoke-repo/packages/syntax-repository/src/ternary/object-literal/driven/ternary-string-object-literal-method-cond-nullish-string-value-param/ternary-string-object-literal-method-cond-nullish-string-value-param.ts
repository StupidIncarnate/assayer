export const ternaryStringObjectLiteralMethodCondNullishStringValueParam = {
    run(value: string | undefined): string {
        return value ?? '' ? 'then' : 'else';
    },
};
