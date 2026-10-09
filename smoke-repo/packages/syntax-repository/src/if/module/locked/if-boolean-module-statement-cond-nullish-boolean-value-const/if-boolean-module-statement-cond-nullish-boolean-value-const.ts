const value: boolean | undefined = true;

if (value ?? false) {
    console.log('then');
}

console.log('else');

export {};
