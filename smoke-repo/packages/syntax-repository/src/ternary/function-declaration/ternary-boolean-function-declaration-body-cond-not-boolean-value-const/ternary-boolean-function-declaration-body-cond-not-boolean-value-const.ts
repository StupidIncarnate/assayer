const value: boolean = true;

export function ternaryBooleanFunctionDeclarationBodyCondNotBooleanValueConst(): string {
    return !value ? 'then' : 'else';
}
