const cond: boolean = true;

export class IfBooleanClassGetterCondConst {
    public get result(): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
