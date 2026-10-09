export const ternaryBooleanObjectLiteralMethodCondGtNumberValueExternal = {
    run(): string {
        return Number(process.argv[2]) > 5 ? 'then' : 'else';
    },
};
