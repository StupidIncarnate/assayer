export const ifNumberObjectLiteralMethodCondParam = {
    run(cond: number): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    },
};
