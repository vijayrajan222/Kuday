export interface UpdateProfilePayload {
  dob?: string;
  gender?: string;
  occupation?: string;
  bio?: string;
}

export interface LifestylePayload {
  userId: string;
  smoking: string;
  drinking: string;
  sleepSchedule: string;
  diet: string;
  cleanliness: string;
  visitorPolicy: string;
  roommateGenderPref: string;
}
