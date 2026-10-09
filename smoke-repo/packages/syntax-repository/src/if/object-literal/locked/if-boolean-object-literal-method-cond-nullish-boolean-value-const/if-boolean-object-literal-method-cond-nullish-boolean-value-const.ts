const value: boolean | undefined = true;

export const ifBooleanObjectLiteralMethodCondNullishBooleanValueConst = {
    run(): string {
        if (value ?? false) {
            return 'then';
        }
        return 'else';
    },
};
