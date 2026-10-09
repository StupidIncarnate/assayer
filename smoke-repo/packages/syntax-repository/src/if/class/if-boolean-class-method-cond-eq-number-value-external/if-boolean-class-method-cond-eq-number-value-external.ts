export class IfBooleanClassMethodCondEqNumberValueExternal {
    public run(): string {
        if (Number(process.argv[2]) === 7) {
            return 'then';
        }
        return 'else';
    }
}
