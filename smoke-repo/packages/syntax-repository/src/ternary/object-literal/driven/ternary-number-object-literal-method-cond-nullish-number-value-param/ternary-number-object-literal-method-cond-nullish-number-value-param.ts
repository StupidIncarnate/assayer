export const ternaryNumberObjectLiteralMethodCondNullishNumberValueParam = {
    run(value: number | undefined): string {
        return value ?? 0 ? 'then' : 'else';
    },
};
