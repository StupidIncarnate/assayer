const cond: boolean = true;

export function ifBooleanFunctionDeclarationBodyCondConst(): string {
    if (cond) {
        return 'then';
    }
    return 'else';
}
