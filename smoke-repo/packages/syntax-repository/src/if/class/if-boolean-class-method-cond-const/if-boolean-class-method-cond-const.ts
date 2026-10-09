const cond: boolean = true;

export class IfBooleanClassMethodCondConst {
    public run(): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
