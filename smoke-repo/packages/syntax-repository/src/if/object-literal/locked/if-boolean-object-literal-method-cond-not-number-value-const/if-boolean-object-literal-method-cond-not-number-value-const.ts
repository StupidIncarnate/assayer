const value: number = 3;

export const ifBooleanObjectLiteralMethodCondNotNumberValueConst = {
    run(): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    },
};
