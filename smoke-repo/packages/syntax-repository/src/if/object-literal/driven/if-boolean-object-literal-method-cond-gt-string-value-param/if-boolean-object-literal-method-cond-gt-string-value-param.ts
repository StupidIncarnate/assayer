export const ifBooleanObjectLiteralMethodCondGtStringValueParam = {
    run(value: string): string {
        if (value > 'm') {
            return 'then';
        }
        return 'else';
    },
};
