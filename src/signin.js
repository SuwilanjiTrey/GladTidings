import React from 'react';
import { auth, provider } from './firebase';

const SignIn = () => {
  const signInWithGoogle = () => {
    auth.signInWithPopup(provider)
      .then((result) => {
        console.log(result);
      })
      .catch((error) => alert(error.message));
  };

  return (
    <div>
      <h1>Sign In</h1>
      <button onClick={signInWithGoogle}>Sign In with Google</button>
    </div>
  );
};

export default SignIn;
