function main(palavra) {
    const charUnic = new Set();

    for (let index = 0; index < palavra.length; index++) {
        char = palavra[index];

        if (charUnic.has(char)) {
            charUnic.delete
        } else {
            charUnic.add(char)
        }

        console.log(char);
        console.log(charUnic);
    }

    if (charUnic.size <= 1) {
        return true;
    }
    return false;

}