let ut = {}

ut.for_each_pair = (array, callback) => {
    loop:
    for (let i = 0; i < array.length; i++) {
        const a = array[i];
        for (let j = i+1; j < array.length; j++) {
            const b = array[j];
            if(callback(a, b, i, j)){
                break loop;
            }
        }
    }
}

export default ut