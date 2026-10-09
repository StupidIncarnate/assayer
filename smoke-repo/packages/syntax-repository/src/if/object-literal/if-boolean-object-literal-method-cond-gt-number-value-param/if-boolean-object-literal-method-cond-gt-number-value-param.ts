export const ifBooleanObjectLiteralMethodCondGtNumberValueParam = {
    run(value: number): string {
        if (value > 5) {
            return 'then';
        }
        return 'else';
    },
};
