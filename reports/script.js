   // Initialize Firebas
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
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const firestore = firebase.firestore();
const storage = firebase.storage();

window.onload = function() {
    const reportsTableBody = document.querySelector("#reportsTable tbody");

    // Reference to the "reports" collection in Realtime Database
    const reportsRef = database.ref("reports");

    // Fetch reports from Realtime Database
    reportsRef.on('value', (snapshot) => {
        reportsTableBody.innerHTML = ""; // Clear the table body

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const report = childSnapshot.val();
                const reportId = childSnapshot.key;
                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${reportId}</td>
                    <td><button onclick="showUserInfo('${report.ReporterUserID}')">${report.ReporterUserID}</button></td>
                    <td>${report.reportReason}</td>
                    <td><button onclick="showUserInfo('${report.ReportedMessageSenderUserID}')">${report.ReportedMessageSenderUserID}</button></td>
                    <td>${report.reportInfo}</td>
                    <td class="dropdown">
                        <button class="dropbtn">Actions</button>
                        <div class="dropdown-content">
                            <button onclick="copyToClipboard('${reportId}')">Copy Report ID</button>
                            <button onclick="copyToClipboard('${report.ReporterUserID}')">Copy Reporter UID</button>
                            <button onclick="copyToClipboard('${report.ReportedMessageSenderUserID}')">Copy Reported UID</button>
                            <button onclick="copyToClipboard('${report.reportInfo}')">Copy Reported MessageID</button>
                            <button onclick="handleAction('${reportId}')">Resolve Report</button>
                        </div>
                    </td>
                `;
                
                reportsTableBody.appendChild(row);
            });
        } else {
            const noReportsRow = document.createElement("tr");
            noReportsRow.innerHTML = `
                <td colspan="6" style="text-align: center;">No reports found</td>
            `;
            reportsTableBody.appendChild(noReportsRow);
        }
    });
};

// Function to show user information in a modal with their profile picture
function showUserInfo(userId) {
    const userRef = firestore.collection("users").doc(userId);
    userRef.get().then((doc) => {
        const userInfo = document.getElementById("userInfo");
        
        if (doc.exists) {
            const user = doc.data();
            const badges = [];
            if (user.isPremium) badges.push('<span class="badge badge-premium">Premium</span>');
            if (user.isAdmin) badges.push('<span class="badge badge-admin">Admin</span>');
            if (user.isOwner) badges.push('<span class="badge badge-owner">Owner</span>');
            
            // Create the base template that will be used for both success and error cases
            const createTemplate = (imageUrl) => `
                <div class="user-info">
                    <img src="${imageUrl}" alt="Profile Picture">
                    <div class="user-info-details">
                        <div class="info-row">
                            <span class="info-label">Username</span>
                            <span class="info-value">${user.Username}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Email</span>
                            <span class="info-value">${user.email || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">User ID</span>
                            <span class="info-value">${userId}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Status</span>
                            <span class="info-value">${badges.join(' ') || 'Standard User'}</span>
                        </div>
                        ${user.additionalInfo ? `
                        <div class="info-row">
                            <span class="info-label">Additional Info</span>
                            <span class="info-value">${user.additionalInfo}</span>
                        </div>` : ''}
                    </div>
                </div>
            `;
            
            // Try to fetch profile picture, use default if not found
            storage.ref(`profile-pictures/${userId}`).getDownloadURL()
                .then((url) => {
                    userInfo.innerHTML = createTemplate(url);
                })
                .catch(() => {
                    userInfo.innerHTML = createTemplate('/Image Assets/default-pfp.png');
                })
                .finally(() => {
                    document.getElementById("userModal").style.display = "block";
                });
        } else {
            userInfo.innerHTML = `
                <div class="user-info">
                    <img src="/Image Assets/default-pfp.png" alt="Default Profile Picture">
                    <div class="user-info-details">
                        <div class="info-row">
                            <span class="info-label">Status</span>
                            <span class="info-value">User not found</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">User ID</span>
                            <span class="info-value">${userId}</span>
                        </div>
                    </div>
                </div>`;
            document.getElementById("userModal").style.display = "block";
        }
    }).catch((error) => {
        console.error("Error fetching user data:", error);
        userInfo.innerHTML = `
            <div class="user-info">
                <img src="/Image Assets/default-pfp.png" alt="Default Profile Picture">
                <div class="user-info-details">
                    <div class="info-row">
                        <span class="info-label">Status</span>
                        <span class="info-value">Error fetching user data</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">User ID</span>
                        <span class="info-value">${userId}</span>
                    </div>
                </div>
            </div>`;
        document.getElementById("userModal").style.display = "block";
    });
}

// Function to close the modal
function closeModal() {
    document.getElementById("userModal").style.display = "none";
}


// Function to handle resolving a report
function handleAction(reportId) {
    // Delete the report from Firebase Realtime Database
    const reportRef = database.ref("reports/" + reportId);
    reportRef.remove()
        .then(() => {
            showNotification(`Report ${reportId} has been resolved and deleted.`);
        })
        .catch((error) => {
            console.error("Error deleting report:", error);
            showNotification("Failed to delete the report. Please try again.");
        });
}


// Function to handle copying text to clipboard
function copyToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    showNotification(`Copied to clipboard: ${text}`);
}

// Function to show notification
function showNotification(message) {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.classList.add("show");
    setTimeout(() => {
        notification.classList.remove("show");
    }, 3000); // Hide after 3 seconds
}
