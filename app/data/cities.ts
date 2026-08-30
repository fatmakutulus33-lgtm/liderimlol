export type City = { name: string; plate: string; region: string; votes: number };
export type DemoUser = { id: string; name: string; city: string; plate: string };

const rows: Array<[string, string, string]> = [
  ["Adana","01","Akdeniz"],["Adıyaman","02","Güneydoğu Anadolu"],["Afyonkarahisar","03","Ege"],["Ağrı","04","Doğu Anadolu"],["Amasya","05","Karadeniz"],["Ankara","06","İç Anadolu"],["Antalya","07","Akdeniz"],["Artvin","08","Karadeniz"],["Aydın","09","Ege"],["Balıkesir","10","Marmara"],["Bilecik","11","Marmara"],["Bingöl","12","Doğu Anadolu"],["Bitlis","13","Doğu Anadolu"],["Bolu","14","Karadeniz"],["Burdur","15","Akdeniz"],["Bursa","16","Marmara"],["Çanakkale","17","Marmara"],["Çankırı","18","İç Anadolu"],["Çorum","19","Karadeniz"],["Denizli","20","Ege"],["Diyarbakır","21","Güneydoğu Anadolu"],["Edirne","22","Marmara"],["Elazığ","23","Doğu Anadolu"],["Erzincan","24","Doğu Anadolu"],["Erzurum","25","Doğu Anadolu"],["Eskişehir","26","İç Anadolu"],["Gaziantep","27","Güneydoğu Anadolu"],["Giresun","28","Karadeniz"],["Gümüşhane","29","Karadeniz"],["Hakkari","30","Doğu Anadolu"],["Hatay","31","Akdeniz"],["Isparta","32","Akdeniz"],["Mersin","33","Akdeniz"],["İstanbul","34","Marmara"],["İzmir","35","Ege"],["Kars","36","Doğu Anadolu"],["Kastamonu","37","Karadeniz"],["Kayseri","38","İç Anadolu"],["Kırklareli","39","Marmara"],["Kırşehir","40","İç Anadolu"],["Kocaeli","41","Marmara"],["Konya","42","İç Anadolu"],["Kütahya","43","Ege"],["Malatya","44","Doğu Anadolu"],["Manisa","45","Ege"],["Kahramanmaraş","46","Akdeniz"],["Mardin","47","Güneydoğu Anadolu"],["Muğla","48","Ege"],["Muş","49","Doğu Anadolu"],["Nevşehir","50","İç Anadolu"],["Niğde","51","İç Anadolu"],["Ordu","52","Karadeniz"],["Rize","53","Karadeniz"],["Sakarya","54","Marmara"],["Samsun","55","Karadeniz"],["Siirt","56","Güneydoğu Anadolu"],["Sinop","57","Karadeniz"],["Sivas","58","İç Anadolu"],["Tekirdağ","59","Marmara"],["Tokat","60","Karadeniz"],["Trabzon","61","Karadeniz"],["Tunceli","62","Doğu Anadolu"],["Şanlıurfa","63","Güneydoğu Anadolu"],["Uşak","64","Ege"],["Van","65","Doğu Anadolu"],["Yozgat","66","İç Anadolu"],["Zonguldak","67","Karadeniz"],["Aksaray","68","İç Anadolu"],["Bayburt","69","Karadeniz"],["Karaman","70","İç Anadolu"],["Kırıkkale","71","İç Anadolu"],["Batman","72","Güneydoğu Anadolu"],["Şırnak","73","Güneydoğu Anadolu"],["Bartın","74","Karadeniz"],["Ardahan","75","Doğu Anadolu"],["Iğdır","76","Doğu Anadolu"],["Yalova","77","Marmara"],["Karabük","78","Karadeniz"],["Kilis","79","Güneydoğu Anadolu"],["Osmaniye","80","Akdeniz"],["Düzce","81","Karadeniz"],
];

export const initialCities: City[] = rows.map(([name, plate, region]) => ({ name, plate, region, votes: 0 }));

// Demo ortamında her ili temsil eden bir kullanıcı bulunur; oyları başlangıçta sıfırdır.
export const demoUsers: DemoUser[] = rows.map(([city, plate]) => ({
  id: `demo-${plate}`,
  name: `${city} Demo`,
  city,
  plate,
}));

export const baseAgaPrice = (plate: string) => ["34", "06", "35", "16", "07"].includes(plate) ? 5 : ["01", "27", "31", "33", "42", "55", "61", "65"].includes(plate) ? 3 : 1;
