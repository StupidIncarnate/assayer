export const ifBooleanObjectLiteralMethodCondNotBooleanValueParam = {
    run(value: boolean): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    },
};
