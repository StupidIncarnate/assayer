const value: string = 'abc';

export class IfBooleanClassGetterCondGtStringValueConst {
    public get result(): string {
        if (value > 'm') {
            return 'then';
        }
        return 'else';
    }
}
