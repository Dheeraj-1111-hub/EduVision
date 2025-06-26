import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [voicePhrase, setVoicePhrase] = useState('');
  const [lastLogin, setLastLogin] = useState('');
  const [profileUpdated, setProfileUpdated] = useState('');

  return (
    <AuthContext.Provider
      value={{
        phoneNumber,
        setPhoneNumber,
        voicePhrase,
        setVoicePhrase,
        lastLogin,
        setLastLogin,
        profileUpdated,
        setProfileUpdated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
