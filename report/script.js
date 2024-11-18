// Initialize Firebase
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
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.getElementById('reportForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const reporterUserId = document.getElementById('reporterUserId').value;
    const reportedUserId = document.getElementById('reportedUserId').value;
    const reportReason = document.getElementById('reportReason').value;
    const reportedMessage = document.getElementById('reportInfo').value;

    const reportData = {
        ReporterUserID: reporterUserId,
        ReportedMessageSenderUserID: reportedUserId,
        reportReason: reportReason,
        reportInfo: reportInfo,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    // Push the report data to Firebase Realtime Database
    database.ref('reports').push(reportData)
        .then(() => {
            showNotification('Report submitted successfully!');
            document.getElementById('reportForm').reset();
        })
        .catch((error) => {
            console.error('Error submitting report:', error);
            showNotification('Error submitting report. Please try again.');
        });
});

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}