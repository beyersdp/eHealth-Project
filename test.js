var reqBodyPostenKraefte = ['A','B','C'];
var postenKraefte = ['A', 'B', 'C', 'D'];

var erg = postenKraefte.filter(o => !reqBodyPostenKraefte.some(i => i == o));

console.log(erg);