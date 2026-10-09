export const ternaryBooleanObjectLiteralArrowPropertyCondGtStringValueExternal = {
    runArrow: (): string => {
        return (process.argv[2] ?? '') > 'm' ? 'then' : 'else';
    },
};
