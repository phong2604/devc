// auth.js - Utility to handle authentication
import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
  } from "amazon-cognito-identity-js";
  
  // Configure the User Pool (replace with your own Cognito User Pool details)
  const poolData = {
    UserPoolId: "us-east-1_xxxxxxx", // Your Cognito User Pool ID
    ClientId: "xxxxxxxxxxxxxxxxxx", // Your App Client ID
  };
  
  const userPool = new CognitoUserPool(poolData);
  
  // Check if the user is authenticated
  export const getCurrentUser = () => {
    const user = userPool.getCurrentUser();
    if (user) {
      return user;
    } else {
      return null;
    }
  };
  
  // Sign out the user
  export const signOut = () => {
    const user = userPool.getCurrentUser();
    if (user) {
      user.signOut();
    }
  };
  