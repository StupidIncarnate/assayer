export class IfBooleanClassMethodCondNullishBooleanValueExternal {
    public run(): string {
        if ((process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false) {
            return 'then';
        }
        return 'else';
    }
}
