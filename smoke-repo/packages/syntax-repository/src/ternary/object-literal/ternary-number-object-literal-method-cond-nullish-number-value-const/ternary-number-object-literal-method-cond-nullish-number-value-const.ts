const value: number | undefined = 3;

export const ternaryNumberObjectLiteralMethodCondNullishNumberValueConst = {
    run(): string {
        return value ?? 0 ? 'then' : 'else';
    },
};
