let storyResults = []; // Global variable to store the stories

// Define an object mapping genres to Font Awesome icons
const genreIcons = {
  action: '<i class="fas fa-bolt"></i>', // Action genre icon
  adventure: '<i class="fas fa-compass"></i>', // Adventure genre icon
  art: '<i class="fas fa-paint-brush"></i>', // Art genre icon
  biography: '<i class="fas fa-user"></i>', // Biography genre icon
  business: '<i class="fas fa-briefcase"></i>', // Business genre icon
  children: '<i class="fas fa-child"></i>', // Children’s genre icon
  comedy: '<i class="fas fa-laugh"></i>', // Comedy genre icon
  crime: '<i class="fas fa-gavel"></i>', // Crime genre icon
  culture: '<i class="fas fa-globe"></i>', // Culture genre icon
  dialogue: '<i class="fas fa-comments"></i>', // Dialogue genre icon
  drama: '<i class="fas fa-theater-masks"></i>', // Drama genre icon
  economics: '<i class="fas fa-chart-line"></i>', // Economics genre icon
  education: '<i class="fas fa-book-reader"></i>', // Education genre icon
  fantasy: '<i class="fas fa-dragon"></i>', // Fantasy genre icon
  food: '<i class="fas fa-utensils"></i>', // Food genre icon
  health: '<i class="fas fa-heartbeat"></i>', // Health genre icon
  history: '<i class="fas fa-landmark"></i>', // History genre icon
  horror: '<i class="fas fa-ghost"></i>', // Horror genre icon
  monologue: '<i class="fas fa-microphone-alt"></i>', // Monologue genre icon
  music: '<i class="fas fa-music"></i>', // Music genre icon
  mystery: '<i class="fas fa-search"></i>', // Mystery genre icon
  nature: '<i class="fas fa-leaf"></i>', // Nature genre icon
  philosophy: '<i class="fas fa-brain"></i>', // Philosophy genre icon
  poetry: '<i class="fas fa-feather-alt"></i>', // Poetry genre icon
  politics: '<i class="fas fa-balance-scale"></i>', // Politics genre icon
  psychology: '<i class="fas fa-brain"></i>', // Psychology genre icon
  religion: '<i class="fas fa-praying-hands"></i>', // Religion genre icon
  romance: '<i class="fas fa-heart"></i>', // Romance genre icon
  science: '<i class="fas fa-flask"></i>', // Science genre icon
  "science fiction": '<i class="fas fa-rocket"></i>', // Sci-Fi genre icon
  "self-help": '<i class="fas fa-hands-helping"></i>', // Self-help genre icon
  sports: '<i class="fas fa-football-ball"></i>', // Sports genre icon
  technology: '<i class="fas fa-microchip"></i>', // Technology genre icon
  thriller: '<i class="fas fa-skull"></i>', // Thriller genre icon
  travel: '<i class="fas fa-plane"></i>', // Travel genre icon
};

const STORY_CACHE_KEY = "storyDataEs";
const STORY_CACHE_TIME_KEY = "storyDataTimestampEs";
const CACHE_EXPIRY_HOURS = 1; // Set cache expiry time

async function fetchAndLoadStoryData() {
  showSpinner(); // Show spinner before loading starts
  try {
    const cachedData = localStorage.getItem(STORY_CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(STORY_CACHE_TIME_KEY);

    // Check if cache is expired
    const now = new Date().getTime();
    const cacheAgeHours = cachedTimestamp
      ? (now - cachedTimestamp) / (1000 * 60 * 60)
      : Infinity;

    if (cachedData && cacheAgeHours < CACHE_EXPIRY_HOURS) {
      console.log("Loading stories from cache.");
      parseStoryCSVData(cachedData);
      hideSpinner(); // End early since we don't need to fetch new data
      return;
    }

    // Fetch the latest data from the network
    const response = await fetch("spanishStories.csv");
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.text();

    // Store CSV text and timestamp in cache
    localStorage.setItem(STORY_CACHE_KEY, data);
    localStorage.setItem(STORY_CACHE_TIME_KEY, now);
    parseStoryCSVData(data);
  } catch (error) {
    console.error("Error fetching or parsing stories CSV file:", error);
  } finally {
    hideSpinner(); // Hide spinner after data loading completes
  }
}

// Parse the CSV data for stories
function parseStoryCSVData(data) {
  Papa.parse(data, {
    header: true,
    skipEmptyLines: true,
    chunkSize: 1024, // Parse in chunks to improve performance
    chunk: function (results, parser) {
      storyResults.push(
        ...results.data.map((entry) => {
          entry.titleSpanish = (entry.titleSpanish || "").trim();
          return entry;
        })
      );
    },
    complete: function () {
      console.log("Parsed and cleaned story data:", storyResults);
    },
    error: function (error) {
      console.error("Error parsing story CSV:", error);
    },
  });
}

// Helper function to determine CEFR class
function getCefrClass(cefrLevel) {
  if (!cefrLevel) return "cefr-unknown"; // Fallback for missing CEFR levels
  const level = cefrLevel.toUpperCase();
  if (["A1"].includes(level)) return "a1";
  if (["A2"].includes(level)) return "a2";
  if (["B1"].includes(level)) return "b1";
  if (["B2"].includes(level)) return "b2";
  if (["C"].includes(level)) return "c1";
  if (["C1"].includes(level)) return "c1";
  if (["C2"].includes(level)) return "c2";

  return "cefr-unknown"; // Default
}

async function displayStoryList(filteredStories = storyResults) {
  showSpinner(); // Show spinner before rendering story list
  restoreSearchContainerInner();
  removeStoryHeader();
  clearContainer(); // Clear previous results

  // Reset the page title and URL to the main list view
  document.title = "Stories - Spanish Dictionary";
  history.replaceState(
    {},
    "",
    `${window.location.origin}${window.location.pathname}`
  );
  updateURL(null, "stories", null);

  // Retrieve selected CEFR and genre filter values
  const selectedCEFR = document
    .getElementById("cefr-select")
    .value.toUpperCase()
    .trim();
  const selectedGenre = document
    .getElementById("genre-select")
    .value.toLowerCase()
    .trim();

  // Filter stories based on selected CEFR and genre
  let filtered = filteredStories.filter((story) => {
    const genreMatch = selectedGenre
      ? story.genre && story.genre.trim().toLowerCase() === selectedGenre
      : true;
    const cefrMatch = selectedCEFR
      ? story.CEFR && story.CEFR.trim().toUpperCase() === selectedCEFR
      : true;
    return genreMatch && cefrMatch;
  });

  // Shuffle the filtered stories using Fisher-Yates algorithm
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }

  // Generate HTML for the filtered, shuffled stories
  let htmlString = ""; // Start with an empty string, as we don't need the header anymore.

  for (const story of filtered) {
    const cefrClass = getCefrClass(story.CEFR); // Determine the CEFR class for styling
    const genreIcon = genreIcons[story.genre.toLowerCase()] || ""; // Get the appropriate genre icon

    htmlString += `
                <div class="stories-list-item" data-title="${
                  story.titleSpanish
                }" onclick="displayStory('${story.titleSpanish.replace(
      /'/g,
      "\\'"
    )}')">
                    <div class="stories-content">
                        <h2>${story.titleSpanish}</h2>
                        ${
                          story.titleSpanish !== story.titleEnglish
                            ? `<p class="stories-subtitle">${story.titleEnglish}</p>`
                            : ""
                        }
                    </div>
                    <div class="stories-detail-container">
                        <div class="stories-genre">${genreIcon}</div>  <!-- Genre icon -->
                        <div class="cefr-value ${cefrClass}">${
      story.CEFR
    }</div>  <!-- CEFR label -->
                    </div>
                </div>
            `;
  }

  // Join the generated HTML for each story and insert into results container
  document.getElementById("results-container").innerHTML = htmlString;
  const listEl = document.getElementById("results-container");
  const storyViewer = document.getElementById("story-viewer");
  const storyContent = document.getElementById("story-content");
  const stickyHeader = document.getElementById("sticky-header");

  if (listEl) listEl.style.display = "block"; // show the list
  if (storyViewer) storyViewer.style.display = "none";
  if (storyContent) storyContent.innerHTML = ""; // clear old story body
  if (stickyHeader) stickyHeader.classList.add("hidden"); // hide header for now
  hideSpinner(); // Hide spinner after story list is rendered
}

async function displayStory(titleSpanish) {
  showSpinner(); // Show spinner at the start of story loading
  const searchContainer = document.getElementById("search-container");
  const searchContainerInner = document.getElementById(
    "search-container-inner"
  );
  const selectedStory = storyResults.find(
    (story) => story.titleSpanish === titleSpanish
  );

  if (!selectedStory) {
    console.error(`No story found with the title: ${titleSpanish}`);
    return;
  }

  document.title = selectedStory.titleSpanish + " - Spanish Dictionary";
  updateURL(null, "story", null, titleSpanish); // Update URL with story parameter

  clearContainer();

  if (!document.querySelector(".stories-story-header")) {
    // Get genre icon and CEFR label
    const genreIcon = genreIcons[selectedStory.genre.toLowerCase()] || "";
    const cefrClass = getCefrClass(selectedStory.CEFR);
    const headerHTML = `
  <div class="sticky-detail-container">
    <div class="sticky-row">
      <div class="sticky-genre">
        ${genreIcon}
      </div>
      <div class="sticky-cefr-label ${cefrClass}">
        ${selectedStory.CEFR || "N/A"}
      </div>
    </div>
    <button id="back-button" class="back-button" onclick="storiesBackBtn()">
      <i class="fas fa-chevron-left"></i> Back
    </button>
  </div>
`;

    const sticky = document.getElementById("sticky-header");
    sticky.classList.remove("hidden");
    sticky.innerHTML = headerHTML;

    // Mirror JP: search UI is hidden while reading
    if (searchContainer) searchContainer.style.display = "none";
  }

  // Check for the image (mirror JP: EN title only)
  const imageFileURL = await hasImageByEnglishTitle(selectedStory.titleEnglish);

  // Check for the audio file
  const audioFileURL = await hasAudio(selectedStory.titleEnglish);
  const audioHTML = audioFileURL
    ? `<audio controls src="${audioFileURL}" class="stories-audio-player"></audio>`
    : "";
  const audio = new Audio(audioFileURL);

  const stickyTitleHTML = `
  <div class="sticky-title-container">
    <h2 class="sticky-title-japanese">${selectedStory.titleSpanish}</h2>
    ${
      selectedStory.titleSpanish !== selectedStory.titleEnglish
        ? `<p class="sticky-title-english">${selectedStory.titleEnglish}</p>`
        : ""
    }
  </div>
`;
  const imageHTML = imageFileURL
    ? `<img src="${imageFileURL}" alt="${selectedStory.titleEnglish}" class="story-image">`
    : "";
  let contentHTML = imageHTML + `<div class="stories-sentences-container">`;
  // Function to finalize and display the story content, with or without audio
  const finalizeContent = (includeAudio = false) => {
    if (includeAudio) {
      contentHTML = audioHTML + contentHTML;
    }

    for (let i = 0; i < spanishSentences.length; i++) {
      const spanishSentence = spanishSentences[i].trim();
      const englishSentence = englishSentences[i]
        ? englishSentences[i].trim()
        : "";

      contentHTML += `
    <div class="couplet">
      <div class="japanese-sentence">${spanishSentence}</div>
      <div class="english-sentence">${englishSentence}</div>
    </div>
  `;
    }

    contentHTML += `</div>`;

    // Append the rating div for this story
    contentHTML += createRatingDiv(selectedStory.titleSpanish);

    const storyViewer = document.getElementById("story-viewer");
    const storyContent = document.getElementById("story-content");
    const listEl = document.getElementById("results-container");

    if (storyContent) {
      storyContent.innerHTML = contentHTML; // render story body into the reader pane
      // Insert the sticky title above the first child (mirror JP order)
      const titleNode = document.createElement("div");
      titleNode.className = "sticky-title-container";
      titleNode.innerHTML = `
  <h2 class="sticky-title-japanese">${selectedStory.titleSpanish}</h2>
  ${
    selectedStory.titleSpanish !== selectedStory.titleEnglish
      ? `<p class="sticky-title-english">${selectedStory.titleEnglish}</p>`
      : ""
  }
`;
      storyContent.insertBefore(titleNode, storyContent.firstChild);
    }
    if (storyViewer) {
      storyViewer.style.display = "block"; // show the reader pane
    }
    if (listEl) {
      listEl.style.display = "none"; // hide the list while reading
    }
    hideSpinner(); // Hide spinner after story content is displayed
  };

  // Check if the audio file exists before finalizing content
  audio.onerror = () => {
    console.log(`No audio file found for: ${audioFileURL}`);
    finalizeContent(false); // Display without audio
  };
  audio.onloadedmetadata = () => {
    // Mirror JP: append audio to #sticky-header
    const stickyHeaderEl = document.getElementById("sticky-header");
    if (stickyHeaderEl && audioHTML) {
      const existing = stickyHeaderEl.querySelector(".stories-audio-player");
      if (existing) existing.remove();
      stickyHeaderEl.insertAdjacentHTML("beforeend", audioHTML);
    }

    // Render content WITHOUT duplicating the audio at the top of the body
    finalizeContent(false);
  };

  // Process story text into sentences
  const standardizedSpanish = selectedStory.spanish.replace(/[“”«»]/g, '"');
  const standardizedEnglish = selectedStory.english.replace(/[“”«»]/g, '"');
  const sentenceRegex = /(?:(["]?.+?[.!?…]["]?)(?=\s|$)|(?:\.\.\."))/g;

  let spanishSentences = standardizedSpanish.match(sentenceRegex) || [
    standardizedSpanish,
  ];
  let englishSentences = standardizedEnglish.match(sentenceRegex) || [
    standardizedEnglish,
  ];

  const combineSentences = (sentences, combineIfContains) => {
    return sentences.reduce((acc, sentence) => {
      const trimmedSentence = sentence.trim();
      const lastSentence = acc[acc.length - 1] || "";

      // Check if the previous sentence ends with a quote and the current sentence contains 'asked'
      if (
        acc.length > 0 &&
        combineIfContains &&
        combineIfContains.test(trimmedSentence) &&
        /["”']$/.test(lastSentence)
      ) {
        acc[acc.length - 1] += " " + trimmedSentence;
      } else if (acc.length > 0 && /^[a-zæøå]/.test(trimmedSentence)) {
        acc[acc.length - 1] += " " + trimmedSentence;
      } else {
        acc.push(trimmedSentence);
      }
      return acc;
    }, []);
  };

  spanishSentences = combineSentences(spanishSentences);
  englishSentences = combineSentences(englishSentences, /\basked\b/i);
}

// Function to toggle the visibility of English sentences and update Spanish box styles
function toggleEnglishSentences() {
  const englishEls = document.querySelectorAll(".english-sentence");
  const englishBtn = document.querySelector(".stories-english-btn");
  if (!englishBtn) return;

  const desktopText = englishBtn.querySelector(".desktop-text");
  const mobileText = englishBtn.querySelector(".mobile-text");
  const isCurrentlyHidden =
    desktopText && desktopText.textContent === "Show English";

  englishEls.forEach((el) => {
    el.style.display = isCurrentlyHidden ? "" : "none";
  });

  if (desktopText)
    desktopText.textContent = isCurrentlyHidden
      ? "Hide English"
      : "Show English";
  if (mobileText) mobileText.textContent = "ENG";
}

function handleGenreChange() {
  const selectedGenre = document
    .getElementById("genre-select")
    .value.trim()
    .toLowerCase();
  const selectedCEFR = document
    .getElementById("cefr-select")
    .value.toUpperCase();

  // Filter the stories based on both the selected genre and CEFR level
  const filteredStories = storyResults.filter((story) => {
    const genreMatch = selectedGenre
      ? story.genre.trim().toLowerCase() === selectedGenre
      : true;
    const cefrMatch = selectedCEFR
      ? story.CEFR && story.CEFR.toUpperCase() === selectedCEFR
      : true;

    return genreMatch && cefrMatch;
  });

  // Call displayStoryList with the filtered stories
  displayStoryList(filteredStories);
}

function storiesBackBtn() {
  document.getElementById("type-select").value = "stories";
  handleTypeChange("stories");
  displayStoryList();
}

// Helper function to remove the story header
function removeStoryHeader() {
  const searchContainer = document.getElementById("search-container"); // The container to update
  const storyHeader = document.querySelector(".stories-story-header");
  searchContainer.style.display = "";
  if (storyHeader) {
    storyHeader.remove();
  }
}

// Helper function to restore the inner
function restoreSearchContainerInner() {
  const searchContainerInner = document.getElementById(
    "search-container-inner"
  ); // The container to update
  searchContainerInner.style.display = "";
}

// Check if an audio file exists based on the English title
async function hasAudio(titleEnglish) {
  const encodedTitleEnglish = encodeURIComponent(titleEnglish);
  const audioFileURLs = [
    `Resources/Audio/${encodedTitleEnglish}.m4a`,
    `Resources/Audio/${encodedTitleEnglish}.mp3`,
  ];

  for (const audioFileURL of audioFileURLs) {
    try {
      // Check if the audio file exists
      const response = await fetch(audioFileURL, {
        method: "HEAD",
        cache: "no-cache",
      });
      if (response.ok) {
        console.log(`Audio found: ${audioFileURL}`);
        return audioFileURL;
      }
    } catch (error) {
      console.error(`Error checking audio for ${audioFileURL}:`, error);
    }
  }

  console.log(`No audio found for title: ${titleEnglish}`);
  return null; // Return null if no audio file is found
}

// Check if an image exists based on the EN title (mirror JP logic)
async function hasImageByEnglishTitle(titleEnglish) {
  const sanitized = titleEnglish.endsWith("?")
    ? titleEnglish.slice(0, -1)
    : titleEnglish;

  const encodedTitles = [
    encodeURIComponent(titleEnglish),
    encodeURIComponent(sanitized),
  ];

  const imageExtensions = ["webp", "jpg", "jpeg", "avif", "png", "gif"];
  const imagePaths = encodedTitles.flatMap((encoded) =>
    imageExtensions.map((ext) => `Resources/Images/${encoded}.${ext}`)
  );

  for (const path of imagePaths) {
    try {
      const res = await fetch(path, { method: "HEAD", cache: "no-cache" });
      if (res.ok) return path;
    } catch (e) {
      console.warn("Error checking image for", path, e);
    }
  }
  return null;
}

// Generate a rating div for each story
function createRatingDiv(storyTitle) {
  const formBaseUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLSeqBt_8Lli1uab2OrhCd7Lz5bYaSwzLO8CB28wKOxa_e45FmQ/formResponse";
  const storyNameEntry = "entry.1887828067";
  const ratingEntry = "entry.1582677227";

  window.submitRating = function (rating, storyTitle) {
    const formData = new FormData();
    formData.append(storyNameEntry, storyTitle);
    formData.append(ratingEntry, rating);

    fetch(formBaseUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    })
      .then(() => {
        alert("Thank you for rating this story!");
      })
      .catch((error) => {
        console.error("Error submitting rating:", error);
        alert("There was an issue submitting your rating. Please try again.");
      });
  };

  const ratingDiv = document.createElement("div");
  ratingDiv.classList.add("stories-rating");
  ratingDiv.innerHTML = `
        <p>Rate this story:</p>
        <div class="stories-star-rating">
            ${[1, 2, 3, 4, 5]
              .map(
                (rating) => `
                <span class="star" data-rating="${rating}" onclick="submitRating(${rating}, '${storyTitle}')">&#9733;</span>
            `
              )
              .join("")}
        </div>
    `;

  const stars = ratingDiv.querySelectorAll(".star");
  stars.forEach((star) => {
    // Hover event to change the color up to the hovered star
    star.addEventListener("mouseenter", () => {
      const rating = star.getAttribute("data-rating");
      stars.forEach((s) => {
        if (s.getAttribute("data-rating") <= rating) {
          s.style.color = "gold";
        } else {
          s.style.color = "gray";
        }
      });
    });

    // Mouseleave event to reset the color
    star.addEventListener("mouseleave", () => {
      stars.forEach((s) => (s.style.color = "gray"));
    });
  });

  return ratingDiv.outerHTML;
}

// Initialization on page load
window.addEventListener("DOMContentLoaded", async () => {
  // Load the story data and wait for it to complete
  await fetchAndLoadStoryData();
  // Now that the data is loaded, check the URL and display based on the URL parameters
  loadStateFromURL();
});
