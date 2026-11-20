export function countVotes(votes) {
  return votes.reduce((total, vote) => total + vote, 0);
}