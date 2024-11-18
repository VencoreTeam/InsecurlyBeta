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
    
    // Get profile picture from Firebase Storage
    const storageRef = firebase.storage().ref();
    const profilePicRef = storageRef.child(`profile-pictures/${uid}`);
    
    // Get download URL for profile picture
    profilePicRef.getDownloadURL()
      .then(function(url) {
        document.getElementById("user-avatar").src = url;
      })
      .catch(function(error) {
        // If profile picture doesn't exist, use default
        document.getElementById("user-avatar").src = "/Image Assets/InsecurlyLogo.png";
      });

    // Fetch the user's data from Firestore
    firestore.collection("users").doc(uid).get()
      .then(function(doc) {
        if (doc.exists) {
          const userData = doc.data();
          // Update username and ban reason
          document.getElementById("username").innerText = "@" + (userData.Username || "Unknown User");
          document.getElementById("ban-reason").innerText = userData.banReason || "No ban reason specified.";
        } else {
          document.getElementById("username").innerText = "Unknown User";
          document.getElementById("ban-reason").innerText = "No ban reason found.";
        }
      })
      .catch(function(error) {
        console.log("Error getting document:", error);
        document.getElementById("username").innerText = "Error loading username";
        document.getElementById("ban-reason").innerText = "Error loading ban reason.";
      });
  } else {
    // No user is signed in.
    document.getElementById("username").innerText = "Not signed in";
    document.getElementById("user-avatar").src = "/Image Assets/InsecurlyLogo.png";
    document.getElementById("ban-reason").innerText = "User is not signed in.";
  }
});
