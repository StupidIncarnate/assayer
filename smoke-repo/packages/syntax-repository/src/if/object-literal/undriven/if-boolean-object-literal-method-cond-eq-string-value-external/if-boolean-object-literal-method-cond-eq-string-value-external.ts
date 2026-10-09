export const ifBooleanObjectLiteralMethodCondEqStringValueExternal = {
    run(): string {
        if ((process.argv[2] ?? '') === 'xyz') {
            return 'then';
        }
        return 'else';
    },
};
