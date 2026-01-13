export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const RELATIONSHIPS = [
  "Father", "Mother", "Spouse", "Brother", "Sister", 
  "Son", "Daughter", "Grandparent", "Friend", "Other"
];

export const TRAINEE_TYPES = [
  "Deck Cadet (DNS)",
  "Deck Cadet (BSc)",
  "Engine Cadet (GME)",
  "Engine Cadet (BTech)",
  "Electrical Cadet (ETO)",
  "Trainee OS",
  "Trainee Wiper"
];

// Utility for Text Casing
export const toProperCase = (str: string) => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

export const toSentenceCase = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};