    // Variable to store the preview theme name
    let previewThemeName;

    // Function to set the theme
    function setTheme(theme) {
      const body = document.body;
      const container = document.getElementById('themeContainer');

      // Remove existing theme classes
      body.classList.remove('dark-mode', 'space-mode', 'gold-mode', 'miles-mode');

      // Remove selected class from all circles
      document.querySelectorAll('.theme-circle').forEach(circle => {
        circle.classList.remove('selected');
      });

      // Apply the selected theme
      switch (theme) {
        case 'dark':
          body.classList.add('dark-mode');
          break;
        case 'space':
          body.classList.add('space-mode');
          break;
        case 'gold':
          body.classList.add('gold-mode');
          break;
        case 'miles':
          body.classList.add('miles-mode');
          break;
        // Default to light theme
        default:
          break;
      }

      // Save the theme preference in localStorage
      localStorage.setItem('theme', theme);

      // Add selected class to the clicked circle
      document.getElementById(`${theme}Theme`).classList.add('selected');

      // Close the theme preview popup
      closePreview();
    }

    // Function to preview the theme
    function previewTheme(theme) {
      const popup = document.getElementById('themePreview');
      previewThemeName = theme;

      // Set the background color and text color based on the selected theme
      switch (theme) {
        case 'dark':
          popup.style.backgroundColor = '#333'; // Set background color to transparent
          popup.style.color = '#fff';
          break;
        case 'space':
          popup.style.backgroundImage = 'url("/Theme Assets/space.png")';
          popup.style.backgroundColor = '#000';
          popup.style.color = '#fff';
          break;
        case 'gold':
          popup.style.backgroundColor = '#ffd700';
          popup.style.color = '#000';
          break;
        case 'miles':
          popup.style.backgroundImage = 'url("/Theme Assets/gwen&miles.png")';
          popup.style.color = '#fff';
          break;
        // Default to light theme
        default:
          popup.style.backgroundImage = 'none'; // Reset background image
          popup.style.backgroundColor = '#000020';
          popup.style.color = 'white';
          break;
      }

      // Show the theme preview popup
      popup.style.display = 'block';
    }

    // Function to close the theme preview popup
    function closePreview() {
      const popup = document.getElementById('themePreview');
      popup.style.display = 'none';

      // Reset background image when closing the preview
      popup.style.backgroundImage = 'none';
    }

    // Function to cancel the theme preview
    function cancelPreview() {
      closePreview();
    }

    // Check for theme preference in localStorage on page load
    document.addEventListener('DOMContentLoaded', function () {
      const savedTheme = localStorage.getItem('theme');
      setTheme(savedTheme || 'light');
    });