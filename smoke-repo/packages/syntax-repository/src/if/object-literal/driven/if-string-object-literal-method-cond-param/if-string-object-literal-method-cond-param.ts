export const ifStringObjectLiteralMethodCondParam = {
    run(cond: string): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    },
};
