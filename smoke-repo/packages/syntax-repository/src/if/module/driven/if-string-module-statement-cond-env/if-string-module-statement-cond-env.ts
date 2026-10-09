const cond = process.env.COND ?? '';

if (cond) {
    console.log('then');
}

console.log('else');

export {};
