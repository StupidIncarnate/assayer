export const ifBooleanObjectLiteralArrowPropertyCondEqBooleanValueExternal = {
    runArrow: (): string => {
        if (process.argv[2] === 'yes' === false) {
            return 'then';
        }
        return 'else';
    },
};
