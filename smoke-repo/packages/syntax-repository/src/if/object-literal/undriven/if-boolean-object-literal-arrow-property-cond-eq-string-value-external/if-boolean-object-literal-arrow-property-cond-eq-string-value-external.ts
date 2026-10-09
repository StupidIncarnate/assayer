export const ifBooleanObjectLiteralArrowPropertyCondEqStringValueExternal = {
    runArrow: (): string => {
        if ((process.argv[2] ?? '') === 'xyz') {
            return 'then';
        }
        return 'else';
    },
};
