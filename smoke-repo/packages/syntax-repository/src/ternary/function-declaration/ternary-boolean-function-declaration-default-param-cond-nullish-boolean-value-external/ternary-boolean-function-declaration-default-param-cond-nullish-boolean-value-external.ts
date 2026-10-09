export function ternaryBooleanFunctionDeclarationDefaultParamCondNullishBooleanValueExternal(label: string = (process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false ? 'then' : 'else'): string {
    return label;
}
