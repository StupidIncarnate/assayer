export const ifBooleanObjectLiteralMethodCondNullishBooleanValueParam = {
    run(value: boolean | undefined): string {
        if (value ?? false) {
            return 'then';
        }
        return 'else';
    },
};
