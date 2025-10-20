import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Створюємо контекст
const AuthContext = createContext(null);

// 2. Створюємо провайдер - компонент, який буде надавати дані
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // При першому завантаженні додатка, перевіряємо localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Функція для входу
  const login = (userData) => {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    setUser(userData);
  };

  // Функція для виходу
  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Створюємо кастомний хук для зручного доступу до контексту
export const useAuth = () => {
  return useContext(AuthContext);
};
