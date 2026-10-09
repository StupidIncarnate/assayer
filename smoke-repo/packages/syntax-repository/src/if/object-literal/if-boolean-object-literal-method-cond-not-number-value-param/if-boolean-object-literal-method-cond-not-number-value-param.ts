export const ifBooleanObjectLiteralMethodCondNotNumberValueParam = {
    run(value: number): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    },
};
