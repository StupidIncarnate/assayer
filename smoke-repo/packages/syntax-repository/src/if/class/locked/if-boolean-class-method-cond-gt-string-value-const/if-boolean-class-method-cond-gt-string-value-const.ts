const value: string = 'abc';

export class IfBooleanClassMethodCondGtStringValueConst {
    public run(): string {
        if (value > 'm') {
            return 'then';
        }
        return 'else';
    }
}
