export class IfBooleanClassMethodCondNotBooleanValueExternal {
    public run(): string {
        if (!(process.argv[2] === 'yes')) {
            return 'then';
        }
        return 'else';
    }
}
