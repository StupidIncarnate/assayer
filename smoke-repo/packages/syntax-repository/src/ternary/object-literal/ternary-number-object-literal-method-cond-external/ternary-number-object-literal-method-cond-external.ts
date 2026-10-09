export const ternaryNumberObjectLiteralMethodCondExternal = {
    run(): string {
        return Number(process.argv[2]) ? 'then' : 'else';
    },
};
