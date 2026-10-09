const cond: number = 3;

export const ifNumberObjectLiteralMethodCondConst = {
    run(): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    },
};
