export const ternaryBooleanObjectLiteralArrowPropertyCondGtNumberValueExternal = {
    runArrow: (): string => {
        return Number(process.argv[2]) > 5 ? 'then' : 'else';
    },
};
