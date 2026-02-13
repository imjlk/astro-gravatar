/// <reference types="astro/client" />

declare module '*.astro' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component: any;
  export default Component;
}
