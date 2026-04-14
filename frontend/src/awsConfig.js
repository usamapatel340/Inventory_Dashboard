// Vercel Configuration for Firestore Integration
export const awsConfig = {
  // API endpoint - Using relative path for Vercel deployment
  // This works for both local (http://localhost:3000) and production
  lambdaEndpoint: process.env.REACT_APP_API_ENDPOINT || "/api",
};

export default awsConfig;
