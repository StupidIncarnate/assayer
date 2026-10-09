const cond = process.env.COND === 'true';

if (cond) {
    console.log('then');
}

console.log('else');

export {};
