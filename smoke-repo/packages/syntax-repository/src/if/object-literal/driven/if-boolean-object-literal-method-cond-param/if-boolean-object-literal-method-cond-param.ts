export const ifBooleanObjectLiteralMethodCondParam = {
    run(cond: boolean): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    },
};
