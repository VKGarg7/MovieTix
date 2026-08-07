export const findParticipantByName = (participants, name) =>
    participants.find(p => p.name.toLowerCase() === name.toLowerCase());
