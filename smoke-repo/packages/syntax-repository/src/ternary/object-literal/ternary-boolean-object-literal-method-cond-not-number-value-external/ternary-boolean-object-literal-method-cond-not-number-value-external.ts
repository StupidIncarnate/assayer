export const ternaryBooleanObjectLiteralMethodCondNotNumberValueExternal = {
    run(): string {
        return !Number(process.argv[2]) ? 'then' : 'else';
    },
};
