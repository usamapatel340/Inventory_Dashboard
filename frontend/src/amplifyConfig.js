import { Amplify } from "aws-amplify";

// Replace the placeholder values below with your Cognito configuration.
const amplifyConfig = {
  Auth: {
    // REQUIRED - Amazon Cognito Region
    region: "ap-south-1",

    // OPTIONAL - Amazon Cognito User Pool ID
    userPoolId: "ap-south-1_OxUvHWqx1",

    // OPTIONAL - Amazon Cognito Web Client ID (App client)
    userPoolWebClientId: "76ef4o66hsegmfkmo1t52p3f5o",
  },
};

export default function configureAmplify() {
  try {
    Amplify.configure(amplifyConfig);
  } catch (e) {
    // noop - will fallback to local demo if not configured
  }
}
