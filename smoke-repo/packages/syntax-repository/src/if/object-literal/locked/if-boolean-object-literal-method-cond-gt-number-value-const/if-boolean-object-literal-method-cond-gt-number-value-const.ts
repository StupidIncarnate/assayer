const value: number = 3;

export const ifBooleanObjectLiteralMethodCondGtNumberValueConst = {
    run(): string {
        if (value > 5) {
            return 'then';
        }
        return 'else';
    },
};
