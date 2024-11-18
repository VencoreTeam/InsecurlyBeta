// Function to redirect to the example page
function redirectToExamplePage() {
  // Replace 'example-page.html' with the actual URL of your example page
  window.location.href = '/@insecurly/Maintenance';
}

// Function to get a random tip
function getRandomTip() {
  const tips = [
    "Life has no meaning, just have fun",
    "Nothing really matters in the end",
    "Everything is temporary, enjoy it while it lasts",
    "im watching you...",
    "i see you...",
    "you are being watched...",
    "you are not alone...",
    "remember, you are being watched..."
    ];
// Keeping old version commented out for reference
/*
  function getRandomTipOLD() {
    const tips = [
      "School can be a mind-numbing experience, but remember it's temporary.",
      "The education system may not always value your individuality; embrace it anyway.", 
      "Sometimes the best lessons happen outside the classroom.",
      "Grades don't measure your creativity or potential.",
      "Question the system; don't let it define your worth.",
      "Education should inspire, not discourage. Seek your inspiration.",
      "Break free from the conformity; think beyond textbooks.",
      "Don't let the structure of school stifle your curiosity.", 
      "The most successful people often took unconventional paths.",
      "Your value isn't determined by standardized tests or grades.",
      "Creativity is often suppressed in traditional educational settings.",
      "The real world doesn't always operate like a classroom.",
      "Don't let the stress of exams overshadow your love for learning.",
      "Learn to navigate the system, but don't let it control you.",
      "You are more than a student ID or a GPA.",
      "School might feel like a prison, but your mind is still free.",
      "The best education goes beyond the walls of a classroom.",
      "Don't conform; challenge the status quo.",
      "The system's flaws don't define your potential.",
      "Question, explore, and find your own path."
    ];
*/

  const randomIndex = Math.floor(Math.random() * tips.length);
  return tips[randomIndex];
}

// Function to display a random tip or a red container with white text
function displayContentBasedOnFlag(redirectFlag) {
  const tipContainer = document.getElementById('randomTip');
  if (tipContainer) {
    if (redirectFlag) {
      // If redirectFlag is true, show red container with white text
      tipContainer.style.fontSize = '16px';
      tipContainer.style.fontWeight = 'bold';
      tipContainer.style.backgroundColor = 'rgba(255, 0, 0, 0.227)'; // Red background
      tipContainer.style.borderRadius = '10px';
      tipContainer.style.padding = '12px';
      tipContainer.textContent = 'Maintenance Is Active, Redirecting...';
    } else {
      // If redirectFlag is false, display a random tip
      const randomTip = getRandomTip();
      tipContainer.textContent = randomTip;
    }
  }
}

// Show loading overlay when the page starts loading
document.addEventListener('DOMContentLoaded', function () {
  const loadingOverlay = document.getElementById('loadingOverlay');

  // Flag to control redirection
  const redirectFlag = false; // True = Maintenance Active || False = Maintenance Not Active

  if (loadingOverlay) {
    // Initially display the loading overlay
    loadingOverlay.style.display = 'flex';

    // Display content based on the redirectFlag
    displayContentBasedOnFlag(redirectFlag);

    // Hide loading overlay after 3 seconds
    setTimeout(function () {
      loadingOverlay.style.display = 'none';

      // Check the redirect flag before redirecting
      if (redirectFlag) {
        redirectToExamplePage();
      }
    }, 3000);
  }
});