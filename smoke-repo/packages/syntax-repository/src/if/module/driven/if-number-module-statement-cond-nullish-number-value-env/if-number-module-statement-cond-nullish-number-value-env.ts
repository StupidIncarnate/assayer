const value = process.env.VALUE === undefined ? undefined : Number(process.env.VALUE);

if (value ?? 0) {
    console.log('then');
}

console.log('else');

export {};
