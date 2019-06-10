var alteKraefte = ['Edwin Scholze', 'Selina Haas', 'Leonie Bartsch'];
var neueKraefte = ['Edwin Scholze']

function notInKraefte(kraft) {
	if (neueKraefte.includes(kraft)) {
	}
	else {
		return kraft;
	}
}

console.log(alteKraefte.filter(notInKraefte));
console.log(alteKraefte.filter(function(kraft){ if(neueKraefte.includes(kraft)){} else {return kraft;}}));


var array = [ { _id: "5cfeab62c4b14d0d94649e88",
    vorname: 'Daniel',
    nachname: 'Reiss-Gerwig',
    hiorg: 'DRK OV RT',
    quali: 'Sanitätshelfer/-in',
    funkruf: 'Daniel Reiss-Gerwig',
    tel: '',
    rettungsmittel: true },
  { _id: "5cfeacd32e98b15368b049cc",
    vorname: 'Miriam',
    nachname: 'Martin',
    hiorg: 'DRK OV RT',
    quali: 'Rettungssanitäter/-in',
    funkruf: 'Miriam Martin',
    tel: '',
    rettungsmittel: false } ];
	
console.log(array.map(x => x.funkruf));