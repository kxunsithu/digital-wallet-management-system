declare module '*.css';
declare module '*.png' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

export {};