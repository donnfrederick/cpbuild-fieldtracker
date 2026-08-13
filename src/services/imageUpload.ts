import { v4 as uuidv4 } from 'uuid';

export const generateSessionID = () => {
  return btoa(uuidv4());
};

export const getSessionId = () => {
  const value = localStorage.getItem('sessionId');

  if (value != null) {
    return JSON.parse(value);
  } else return null;
};

export const storeSessionId = (sessionId: string) => {
  localStorage.setItem('sessionId', sessionId);
};
