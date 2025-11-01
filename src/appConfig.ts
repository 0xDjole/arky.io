import devConfig from "../config/dev.json";
import prodConfig from "../config/prod.json";

const environment = import.meta.env.PUBLIC_ENVIRONMENT || "dev";

export const appConfig = environment === "prod" ? prodConfig : devConfig;

// Note: SDK is initialized in src/lib/arky.ts
// Import { arky } from '@lib/index' to use the SDK

export default appConfig;
