const value: string = 'abc';

export const ifBooleanObjectLiteralMethodCondNotStringValueConst = {
    run(): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    },
};
