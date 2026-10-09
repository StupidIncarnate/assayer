const value: number = 3;

export function ternaryBooleanFunctionDeclarationDefaultParamCondGtNumberValueConst(label: string = value > 5 ? 'then' : 'else'): string {
    return label;
}
