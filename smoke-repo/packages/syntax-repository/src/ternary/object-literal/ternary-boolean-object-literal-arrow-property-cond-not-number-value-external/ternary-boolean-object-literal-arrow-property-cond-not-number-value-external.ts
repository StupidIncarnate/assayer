export const ternaryBooleanObjectLiteralArrowPropertyCondNotNumberValueExternal = {
    runArrow: (): string => {
        return !Number(process.argv[2]) ? 'then' : 'else';
    },
};
