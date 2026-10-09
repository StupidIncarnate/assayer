const cond: boolean = true;

export const ifBooleanObjectLiteralMethodCondConst = {
    run(): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    },
};
