export const ifNumberObjectLiteralMethodCondArrayLengthNumberReceiverExternal = {
    run(): string {
        if (process.argv.slice(2).map(Number).length) {
            return 'then';
        }
        return 'else';
    },
};
