const value: boolean = true;

export const ifBooleanObjectLiteralMethodCondNotBooleanValueConst = {
    run(): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    },
};
