export function ternaryStringFunctionDeclarationDefaultParamCondExternal(label: string = process.argv[2] ?? '' ? 'then' : 'else'): string {
    return label;
}
