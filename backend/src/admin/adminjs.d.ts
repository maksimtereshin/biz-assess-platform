/**
 * Type declarations for AdminJS ESM modules
 * These are needed because the packages are ESM but our project uses CommonJS
 */

declare module "@adminjs/typeorm" {
  export class Database {
    constructor(dataSource: any);
    static isAdapterFor(database: any): boolean;
  }
  export class Resource {
    constructor(entity: any);
    static isAdapterFor(rawResource: any): boolean;
  }
}

declare module "@adminjs/express" {
  const buildRouter: (admin: any, auth?: any, sessionOptions?: any) => any;
  export default { buildRouter };
}
