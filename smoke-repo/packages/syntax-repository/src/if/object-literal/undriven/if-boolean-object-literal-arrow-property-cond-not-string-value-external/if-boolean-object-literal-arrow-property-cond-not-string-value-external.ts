export const ifBooleanObjectLiteralArrowPropertyCondNotStringValueExternal = {
    runArrow: (): string => {
        if (!(process.argv[2] ?? '')) {
            return 'then';
        }
        return 'else';
    },
};
