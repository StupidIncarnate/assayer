export const ifBooleanObjectLiteralArrowPropertyCondNotNumberValueExternal = {
    runArrow: (): string => {
        if (!Number(process.argv[2])) {
            return 'then';
        }
        return 'else';
    },
};
