/**
 * Notable landmarks per district for the Tourism department overlay.
 * Covers Tamil Nadu and Gujarat districts.
 * Images: Wikimedia Commons Special:FilePath URLs (CC-licensed, public domain).
 */
export interface Landmark {
  name: string;
  type: string;
  imageUrl: string;
  description: string;
  lat?: number;
  lng?: number;
}

const WM = (file: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=600`;

export const TN_LANDMARKS: Record<string, Landmark> = {
  "Thanjavur": {
    name: "Brihadeeswarar Temple (Thanjai Periya Kovil)",
    type: "UNESCO World Heritage Site",
    imageUrl: WM("Thanjavur_Big_Temple_2.jpg"),
    description: "1000-year-old Chola masterpiece, tallest ancient temple in India",
    lat: 10.7828, lng: 79.1318,
  },
  "Nagapattinam": {
    name: "Velankanni Shrine Basilica",
    type: "Sacred Pilgrimage Site",
    imageUrl: WM("Velankanni_Shrine_Basilica.jpg"),
    description: "Asia's most visited Catholic shrine, draws millions annually",
    lat: 10.6870, lng: 79.8456,
  },
  "Madurai": {
    name: "Meenakshi Amman Temple",
    type: "Temple Complex",
    imageUrl: WM("Meenakshi_temple_Entry.jpg"),
    description: "14-gopuram Dravidian temple, hallmark of Pandya architecture",
    lat: 9.9195, lng: 78.1193,
  },
  "Tiruchirapalli": {
    name: "Rockfort Temple (Uchi Pillayar Koil)",
    type: "Rock Temple",
    imageUrl: WM("Rockfort_temple.jpg"),
    description: "Ancient Ganesha temple atop 83m volcanic rock formation",
    lat: 10.8253, lng: 78.6939,
  },
  "Tiruchchirappalli": {
    name: "Rockfort Temple (Uchi Pillayar Koil)",
    type: "Rock Temple",
    imageUrl: WM("Rockfort_temple.jpg"),
    description: "Ancient Ganesha temple atop 83m volcanic rock formation",
    lat: 10.8253, lng: 78.6939,
  },
  "Kanniyakumari": {
    name: "Vivekananda Rock Memorial",
    type: "National Memorial",
    imageUrl: WM("Vivekananda_Rock_Memorial.jpg"),
    description: "Island memorial at India's southernmost tip, three seas confluence",
    lat: 8.0883, lng: 77.5385,
  },
  "Nilgiris": {
    name: "Ooty (Udhagamandalam) & Nilgiri Mountain Railway",
    type: "Hill Station & UNESCO Railway",
    imageUrl: WM("Nilgiri_Mountain_Railway.jpg"),
    description: "Queen of Hill Stations; toy train is a UNESCO World Heritage site",
    lat: 11.4102, lng: 76.6950,
  },
  "Coimbatore": {
    name: "Isha Yoga Center & Adiyogi Statue",
    type: "Spiritual & Cultural Landmark",
    imageUrl: WM("Adiyogi_Shiva_statue.jpg"),
    description: "112ft Adiyogi statue, largest bust statue in the world",
    lat: 11.0168, lng: 76.9558,
  },
  "Chennai": {
    name: "Marina Beach",
    type: "Natural Landmark",
    imageUrl: WM("Marina_Beach_Chennai.jpg"),
    description: "World's longest natural urban beach, 13km Chennai coastline",
    lat: 13.0500, lng: 80.2824,
  },
  "Kancheepuram": {
    name: "Kailasanathar Temple",
    type: "UNESCO-listed Temple",
    imageUrl: WM("Kailasanathar_Temple,_Kanchipuram.jpg"),
    description: "Oldest stone temple in Tamil Nadu, 8th century Pallava architecture",
    lat: 12.8406, lng: 79.6903,
  },
  "Tiruvannamalai": {
    name: "Arunachaleswara Temple",
    type: "Shiva Temple",
    imageUrl: WM("Annamalaiyar_Temple.jpg"),
    description: "Pancha Bhuta Stalas for fire element; one of the largest temples in India",
    lat: 12.2318, lng: 79.0667,
  },
  "Thoothukudi": {
    name: "Tiruchendur Murugan Temple",
    type: "Coastal Temple",
    imageUrl: WM("Thiruchendur_Murugan_Temple.jpg"),
    description: "Cliff-side Murugan temple on the Bay of Bengal, one of six abodes",
    lat: 8.4982, lng: 78.1231,
  },
  "Ramanathapuram": {
    name: "Ramanathaswamy Temple, Rameshwaram",
    type: "Char Dham Pilgrimage",
    imageUrl: WM("Ramanathaswamy_Temple.jpg"),
    description: "Longest corridor of any temple in the world; one of the Char Dhams",
    lat: 9.2882, lng: 79.3130,
  },
  "Cuddalore": {
    name: "Pichavaram Mangrove Forest",
    type: "Eco-Tourism Site",
    imageUrl: WM("Pichavaram_mangrove_backwaters.jpg"),
    description: "Second largest mangrove forest in the world; boating through waterways",
    lat: 11.4298, lng: 79.7717,
  },
  "Dharmapuri": {
    name: "Hogenakkal Falls",
    type: "Natural Waterfall",
    imageUrl: WM("Hogenakkal_falls.jpg"),
    description: "Niagara of India; carbonatite rocks unique in Asia; coracle rides",
    lat: 12.1175, lng: 77.7923,
  },
  "Ariyalur": {
    name: "Gangaikonda Cholapuram Temple",
    type: "UNESCO World Heritage Site",
    imageUrl: WM("Gangaikonda_Cholapuram_Temple.jpg"),
    description: "Chola capital temple; nearly equal to Brihadeeswarar in grandeur",
    lat: 11.2074, lng: 79.4490,
  },
  "Tirunelveli Kattabo": {
    name: "Nellai Tirunelveli Temple",
    type: "Ancient Shiva Temple",
    imageUrl: WM("Tirunelveli_temple.jpg"),
    description: "Historic Shiva temple; important pilgrimage site in Tamil Nadu",
    lat: 8.7250, lng: 77.5400,
  },
  "Dindigul": {
    name: "Dindigul Fort",
    type: "Heritage Fort",
    imageUrl: WM("Dindigul_fort.jpg"),
    description: "17th century rock fort; panoramic views of Kodaikanal Hills",
    lat: 10.3624, lng: 77.9695,
  },
  "Namakkal": {
    name: "Namakkal Fort",
    type: "Rock Fort",
    imageUrl: WM("Namakkal_fort.jpg"),
    description: "Monolithic Hanuman; ancient fort rock with temple shrines",
    lat: 11.2200, lng: 78.1680,
  },
  "Erode": {
    name: "Bhavani Sangamam",
    type: "River Confluence",
    imageUrl: WM("Bhavani_Sangamam.jpg"),
    description: "Triveni confluence of Kaveri, Bhavani and hidden Amudha rivers",
    lat: 11.4478, lng: 77.6835,
  },
  "Salem": {
    name: "Yercaud Hill Station",
    type: "Hill Station",
    imageUrl: WM("Yercaud_Lake.jpg"),
    description: "Poor man's Ooty; coffee and orange plantations; Shevaroy range",
    lat: 11.7751, lng: 78.2071,
  },
  "Theni": {
    name: "Meghamalai (Cloud Land)",
    type: "Eco-Tourism",
    imageUrl: WM("Meghamalai_landscape.jpg"),
    description: "Pristine cloud forest; cardamom and tea estates; Upper Periyar wildlife",
    lat: 9.7667, lng: 77.3167,
  },
  "Vellore": {
    name: "Vellore Fort",
    type: "Heritage Fort",
    imageUrl: WM("Vellore_Fort.jpg"),
    description: "16th century Vijayanagara fort; one of the largest forts in India",
    lat: 12.9231, lng: 79.1325,
  },
  "Sivaganga": {
    name: "Sivaganga Palace",
    type: "Heritage Palace",
    imageUrl: WM("Sivaganga_Palace_entrance.jpg"),
    description: "Historic 19th century Nattukotai Chettiars mansions; unique cuisine",
    lat: 10.0803, lng: 78.7948,
  },
  "Karur": {
    name: "Kalyana Thirukoil",
    type: "Ancient Shiva Temple",
    imageUrl: WM("Karur_Ayyaranathar.jpg"),
    description: "2000-year-old Sangam-era temple; significant in Tamil literature",
    lat: 10.9601, lng: 78.0766,
  },
  "Perambalur": {
    name: "Tirumanur Temple",
    type: "Ancient Temple",
    imageUrl: WM("Tirumanur_Temple.jpg"),
    description: "Historic Shiva temple; agricultural heartland location",
    lat: 11.3333, lng: 79.0000,
  },
  "Pudukkottai": {
    name: "Pudukkottai Palace",
    type: "Heritage Palace",
    imageUrl: WM("Pudukkottai_Palace.jpg"),
    description: "18th century palace; symbol of Pudukkottai princely state",
    lat: 10.3833, lng: 78.8167,
  },
  "Villupuram": {
    name: "Gingee Fort",
    type: "Historical Fort",
    imageUrl: WM("Gingee_Fort.jpg"),
    description: "Massive 16th century fort; 'Troy of the East'",
    lat: 12.2500, lng: 79.9167,
  },
  "Virudhunagar": {
    name: "Tiruchendur Beach",
    type: "Beach & Temple",
    imageUrl: WM("Tiruchendur_beach.jpg"),
    description: "Coastal town with rich cultural heritage",
    lat: 8.7667, lng: 77.9333,
  },
  "Thiruvallur": {
    name: "Tiruvallur Temple",
    type: "Ancient Temple",
    imageUrl: WM("Thiruvallur_Temple.jpg"),
    description: "Ancient Shiva temple; site of the famous Tiruvalluvar statue",
    lat: 13.1389, lng: 79.8967,
  },
  "Thiruvarur": {
    name: "Thyagaraja Temple",
    type: "Shiva Temple",
    imageUrl: WM("Tyagaraja_Temple_Thiruvarur.jpg"),
    description: "Sacred temple; associated with Saint Thyagaraja",
    lat: 10.7667, lng: 79.1333,
  },
  "Krishnagiri": {
    name: "Krishnagiri Fort",
    type: "Heritage Fort",
    imageUrl: WM("Krishnagiri_Fort.jpg"),
    description: "Historic fort with panoramic views of surrounding areas",
    lat: 12.1833, lng: 78.8167,
  },
};

/** Notable landmarks for Gujarat districts. */
export const GJ_LANDMARKS: Record<string, Landmark> = {
  "Ahmadabad": {
    name: "Sabarmati Ashram",
    type: "Historical Monument",
    imageUrl: WM("Sabarmati_Ashram,_Ahmedabad.jpg"),
    description: "Home of Mahatma Gandhi; pivotal role in Indian independence movement",
    lat: 23.1815, lng: 72.5533,
  },
  "Surat": {
    name: "Dumas Beach",
    type: "Beach Landmark",
    imageUrl: WM("Dumas_Beach,_Surat,_Gujarat,_India.jpg"),
    description: "Pristine beach famous for silver sands and sunset views",
    lat: 21.1458, lng: 72.7930,
  },
  "Rajkot": {
    name: "Kaba Gandhi Ni Vato",
    type: "Heritage Street",
    imageUrl: WM("Kaba_Gandhi_Ni_Vato.jpg"),
    description: "Historic lane where Mahatma Gandhi spent formative years",
    lat: 22.3039, lng: 70.7861,
  },
  "Vadodara": {
    name: "Laxmi Vilas Palace",
    type: "Royal Palace",
    imageUrl: WM("The_Laxmi_Vilas_Palace,_Vadodara.jpg"),
    description: "Magnificent Indo-Saracenic palace; 4 times larger than Buckingham Palace",
    lat: 22.3072, lng: 73.1812,
  },
  "Gandhinagar": {
    name: "Akshardham",
    type: "Spiritual Complex",
    imageUrl: WM("Akshardham_night_view.jpg"),
    description: "Grand Hindu temple showcasing 5000 years of Indian culture",
    lat: 23.1950, lng: 72.5950,
  },
  "Kachchh": {
    name: "Rann of Kachchh (White Desert)",
    type: "Natural Wonder",
    imageUrl: WM("Rann_of_Kachchh,_Moonrise.jpg"),
    description: "Vast salt marsh landscape; world's largest salt desert with white expanse",
    lat: 23.7339, lng: 71.0939,
  },
  "Jamnagar": {
    name: "Jamnagar Harbour",
    type: "Coastal Heritage",
    imageUrl: WM("Jamnagar_Harbour.jpg"),
    description: "Historic pearl and bead trading port with traditional architecture",
    lat: 22.4707, lng: 70.0883,
  },
  "Bhavnagar": {
    name: "Palitana Temples",
    type: "Sacred Jain Sites",
    imageUrl: WM("Palitana_temples.jpg"),
    description: "863 intricately carved Jain temples atop Shatrunjaya Hill",
    lat: 22.1248, lng: 71.8287,
  },
  "Junagadh": {
    name: "Asiatic Lion in Gir Forest",
    type: "Wildlife Sanctuary",
    imageUrl: WM("Asiatic_Lion_Walking.jpg"),
    description: "Last refuge of the Asiatic lion; home to 500+ wild lions",
    lat: 21.4701, lng: 70.6831,
  },
  "Porbandar": {
    name: "Porbandar Beach",
    type: "Beach & Heritage",
    imageUrl: WM("Porbandar_Beach.jpg"),
    description: "Birthplace of Mahatma Gandhi; golden beaches and harbor charm",
    lat: 21.6412, lng: 69.6033,
  },
  "Devbhumi Dwarka": {
    name: "Dwarkadhish Temple",
    type: "Sacred Temple",
    imageUrl: WM("Dwarkadhish_temple.jpg"),
    description: "Ancient shrine dedicated to Lord Krishna; one of the four Dhams",
    lat: 22.2396, lng: 68.9678,
  },
  "Anand": {
    name: "Amul Cooperative Heritage",
    type: "Industrial Heritage",
    imageUrl: WM("AMUL_Headquarters.jpg"),
    description: "World's largest dairy cooperative; birthplace of the White Revolution",
    lat: 22.5644, lng: 72.9289,
  },
  "Mehsana": {
    name: "Modhera Sun Temple",
    type: "Ancient Sun Temple",
    imageUrl: WM("Modhera_Sun_Temple_-_exterior.jpg"),
    description: "11th century Solanki dynasty sun temple; architectural marvel",
    lat: 23.6083, lng: 72.0158,
  },
};
