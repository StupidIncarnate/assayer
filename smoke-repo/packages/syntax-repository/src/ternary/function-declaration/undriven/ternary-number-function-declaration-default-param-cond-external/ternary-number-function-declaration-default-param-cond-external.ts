export function ternaryNumberFunctionDeclarationDefaultParamCondExternal(label: string = Number(process.argv[2]) ? 'then' : 'else'): string {
    return label;
}
