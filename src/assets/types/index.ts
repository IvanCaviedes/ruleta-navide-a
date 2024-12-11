export interface User {
  id: string;
  name: string;
  vote?: Vote;
}
export interface Vote {
  id: string;
  voted: string;
  voter: string;
}
