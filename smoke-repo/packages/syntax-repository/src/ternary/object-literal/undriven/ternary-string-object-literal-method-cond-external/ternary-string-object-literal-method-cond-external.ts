export const ternaryStringObjectLiteralMethodCondExternal = {
    run(): string {
        return process.argv[2] ?? '' ? 'then' : 'else';
    },
};
