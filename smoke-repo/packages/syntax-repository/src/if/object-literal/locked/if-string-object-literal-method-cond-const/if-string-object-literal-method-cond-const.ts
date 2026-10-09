const cond: string = 'abc';

export const ifStringObjectLiteralMethodCondConst = {
    run(): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    },
};
