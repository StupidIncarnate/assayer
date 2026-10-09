export class IfBooleanClassMethodCondGtNumberValueExternal {
    public run(): string {
        if (Number(process.argv[2]) > 5) {
            return 'then';
        }
        return 'else';
    }
}
