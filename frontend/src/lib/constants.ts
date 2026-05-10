/** State capitals (latitude, longitude) for ICCC Nodal markers. */
export const STATE_CAPITALS: Record<string, [number, number]> = {
  "Andhra Pradesh":   [15.9129, 79.7400],   // Amaravati area
  "Arunachal Pradesh":[27.0844, 93.6053],
  "Assam":            [26.1433, 91.7898],
  "Bihar":            [25.5941, 85.1376],
  "Chhattisgarh":     [21.2514, 81.6296],
  "Goa":              [15.4909, 73.8278],
  "Gujarat":          [23.2156, 72.6369],
  "Haryana":          [30.7333, 76.7794],
  "Himachal Pradesh": [31.1048, 77.1734],
  "Jammu and Kashmir":[34.0837, 74.7973],
  "Jharkhand":        [23.3441, 85.3096],
  "Karnataka":        [12.9716, 77.5946],
  "Kerala":           [8.5241,  76.9366],
  "Madhya Pradesh":   [23.2599, 77.4126],
  "Maharashtra":      [18.9388, 72.8354],
  "Manipur":          [24.8170, 93.9368],
  "Meghalaya":        [25.5788, 91.8933],
  "Mizoram":          [23.7307, 92.7173],
  "Nagaland":         [25.6751, 94.1086],
  "Odisha":           [20.2961, 85.8245],
  "Punjab":           [30.7333, 76.7794],
  "Rajasthan":        [26.9124, 75.7873],
  "Sikkim":           [27.3389, 88.6065],
  "Tamil Nadu":       [13.0827, 80.2707],
  "Telangana":        [17.3850, 78.4867],
  "Tripura":          [23.8315, 91.2868],
  "Uttar Pradesh":    [26.8467, 80.9462],
  "Uttarakhand":      [30.3165, 78.0322],
  "West Bengal":      [22.5726, 88.3639],
  "Andaman and Nicobar":[11.6234, 92.7265],
  "Chandigarh":       [30.7333, 76.7794],
  "Dadra and Nagar Haveli":[20.1809, 73.0169],
  "Daman and Diu":    [20.4283, 72.8397],
  "Delhi":            [28.6139, 77.2090],
  "Lakshadweep":      [10.5593, 72.6358],
  "Puducherry":       [11.9416, 79.8083],
};

export const DEPT_REGISTRY = [
  { code: "health",    name: "Health",         accent: "#00D4AA", icon: "Heart",          tagline: "IMR · MMR · OOPE" },
  { code: "education", name: "Education",       accent: "#4A9EFF", icon: "BookOpen",       tagline: "GER · PTR · Dropout" },
  { code: "wcd",       name: "Women & Child",   accent: "#FF6B9D", icon: "Users",          tagline: "CSR · SAM · FLFPR" },
  { code: "revenue",   name: "Revenue Admin",   accent: "#FFB347", icon: "Landmark",       tagline: "TAT · Redressal · Digi" },
  { code: "energy",    name: "Energy",          accent: "#7FE0FF", icon: "Zap",            tagline: "RE% · AIS · EV/L" },
  { code: "disaster",  name: "Disaster Mgmt",   accent: "#FF5757", icon: "ShieldAlert",    tagline: "ART · EWC · Relief" },
  { code: "tourism",   name: "Tourism",         accent: "#A78BFA", icon: "Compass",        tagline: "Domestic · FTA · Occ" },
];

export const UCF_TOTAL_CR = 1_00_000;
export const UCF_CENTRAL_SHARE = 0.60;
export const UCF_STATE_SHARE   = 0.40;
