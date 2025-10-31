declare module 'react' {
  export * from 'react';
}

declare module 'react/jsx-runtime' {
  export * from 'react/jsx-runtime';
}

declare module 'jwt-decode' {
  export function jwtDecode<T = any>(token: string): T;
}
