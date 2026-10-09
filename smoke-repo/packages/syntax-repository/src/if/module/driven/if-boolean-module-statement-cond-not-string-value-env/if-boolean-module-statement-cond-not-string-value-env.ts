const value = process.env.VALUE ?? '';

if (!value) {
    console.log('then');
}

console.log('else');

export {};
