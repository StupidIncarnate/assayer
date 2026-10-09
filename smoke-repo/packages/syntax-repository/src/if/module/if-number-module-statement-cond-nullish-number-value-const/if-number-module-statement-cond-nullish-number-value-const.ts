const value: number | undefined = 3;

if (value ?? 0) {
    console.log('then');
}

console.log('else');

export {};
