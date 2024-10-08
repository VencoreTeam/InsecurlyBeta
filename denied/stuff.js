   // Insecurly CONFIG
   const firebaseConfig = {
    apiKey: "AIzaSyD9E3RbY5Jew5Xa_o5JuYzLwWLGDonFGB0",
    authDomain: "insecurly.firebaseapp.com",
    databaseURL: "https://insecurly-default-rtdb.firebaseio.com",
    projectId: "insecurly",
    storageBucket: "insecurly.appspot.com",
    messagingSenderId: "720308147008",
    appId: "1:720308147008:web:1965bbaee381b55fe620a5",
    measurementId: "G-L1KYG6M7WZ"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var firestore = firebase.firestore();

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    var uid = user.uid;
    // Fetch the user's ban reason from Firestore
    firestore.collection("users").doc(uid).get().then(function(doc) {
      if (doc.exists) {
        var banReason = doc.data().BanReason; // Make sure 'BanReason' matches the field name in Firestore
        document.getElementById("ban-reason").innerText = banReason;
      } else {
        document.getElementById("ban-reason").innerText = "No ban reason found.";
      }
    }).catch(function(error) {
      console.log("Error getting document:", error);
    });
  } else {
    // No user is signed in.
    document.getElementById("ban-reason").innerText = "User is not signed in.";
  }
});
