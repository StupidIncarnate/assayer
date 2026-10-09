const value: string = 'abc';

export function ternaryBooleanFunctionDeclarationBodyCondNotStringValueConst(): string {
    return !value ? 'then' : 'else';
}
