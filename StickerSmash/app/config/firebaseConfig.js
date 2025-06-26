import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AlzaSyAyTDaVvOP5VDilErjptHGox2NwdLLQzBE",
    authDomain: "eduViz.firebaseapp.com",
    projectId: "eduviz-dd70d",
    storageBucket: "eduViz.appspot.com",
    messagingSenderId: "194435802949",
    appId: "1:194435802949:web:xxxxxxxxxxxxxxxx",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, signInWithPhoneNumber, RecaptchaVerifier };




