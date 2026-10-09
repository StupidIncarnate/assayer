export function ternaryBooleanFunctionDeclarationDefaultParamCondNotNumberValueExternal(label: string = !Number(process.argv[2]) ? 'then' : 'else'): string {
    return label;
}
