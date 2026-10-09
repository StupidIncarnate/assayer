const value: boolean | undefined = true;

export function ternaryBooleanFunctionDeclarationBodyCondNullishBooleanValueConst(): string {
    return value ?? false ? 'then' : 'else';
}
