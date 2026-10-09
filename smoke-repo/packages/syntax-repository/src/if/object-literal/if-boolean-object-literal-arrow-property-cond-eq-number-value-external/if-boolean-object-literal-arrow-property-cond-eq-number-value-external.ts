export const ifBooleanObjectLiteralArrowPropertyCondEqNumberValueExternal = {
    runArrow: (): string => {
        if (Number(process.argv[2]) === 7) {
            return 'then';
        }
        return 'else';
    },
};
