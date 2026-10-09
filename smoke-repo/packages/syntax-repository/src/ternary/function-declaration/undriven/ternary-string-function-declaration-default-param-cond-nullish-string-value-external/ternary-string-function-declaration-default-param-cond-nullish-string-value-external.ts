export function ternaryStringFunctionDeclarationDefaultParamCondNullishStringValueExternal(label: string = (process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '' ? 'then' : 'else'): string {
    return label;
}
