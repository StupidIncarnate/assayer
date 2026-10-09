export const ifStringObjectLiteralArrowPropertyCondNullishStringValueExternal = {
    runArrow: (): string => {
        if ((process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '') {
            return 'then';
        }
        return 'else';
    },
};
