export const ifBooleanObjectLiteralMethodCondNotStringValueExternal = {
    run(): string {
        if (!(process.argv[2] ?? '')) {
            return 'then';
        }
        return 'else';
    },
};
