const value: number | undefined = 3;

export const ifNumberObjectLiteralMethodCondNullishNumberValueConst = {
    run(): string {
        if (value ?? 0) {
            return 'then';
        }
        return 'else';
    },
};
