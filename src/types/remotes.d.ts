/// <reference types="react" />

// Module Federation remote type definitions
// Add type declarations for your remote modules here

declare module 'remote1/*' {
  const Component: React.ComponentType<any>;
  export default Component;
}

// Add more remote declarations as needed
// Example:
// declare module 'remote2/*' {
//   const Component: React.ComponentType<any>;
//   export default Component;
// }
