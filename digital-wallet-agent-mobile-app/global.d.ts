declare module '*.css';
declare module '*.png' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

// Allow importing CSS files in the web entry (silences TS for side-effect CSS imports)
