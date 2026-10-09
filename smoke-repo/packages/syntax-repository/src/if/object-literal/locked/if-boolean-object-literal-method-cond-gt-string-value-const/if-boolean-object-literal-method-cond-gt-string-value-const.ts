const value: string = 'abc';

export const ifBooleanObjectLiteralMethodCondGtStringValueConst = {
    run(): string {
        if (value > 'm') {
            return 'then';
        }
        return 'else';
    },
};
