// Main application logic for English Dictation Revision App with SEN support

// Global state
let passageWords = [];
let learnedWords = new Set();
let currentWord = null;
let spellingTestWords = [];
let spellingTestIndex = 0;
let spellingScore = 0;
let spellingTotal = 0;
let revisionAnswers = [];
let revisionScore = 0;
let revisionTotal = 0;
let totalStars = 0;
let wordBank = [];
let focusModeWords = [];
let focusModeIndex = 0;
let currentDifficulty = 'easy';
let currentPassageTitle = '';

// SEN Settings
let settings = {
  speechRate: 0.7,
  textSize: 'medium',
  repetitionCount: 2,
  highContrast: false,
  focusMode: false
};

// Progress tracking
let progress = {
  totalWordsLearned: 0,
  totalSessions: 0,
  totalStars: 0,
  spellingScores: [],
  revisionScores: [],
  difficultWords: [],
  recentActivity: [],
  progressHistory: []
};

// Encouraging messages for SEN students
const ENCOURAGEMENTS = [
  "Great job! 🌟",
  "Well done! ⭐",
  "You're amazing! 🎉",
  "Keep it up! 💪",
  "Fantastic! 🌈",
  "You did it! 🎊",
  "Super work! 🦸",
  "Brilliant! ✨",
  "Excellent! 🏆",
  "You're a star! ⭐"
];

const TRY_AGAIN_MESSAGES = [
  "Good try! Let's practice more! 💪",
  "Almost there! Keep going! 🌟",
  "You're learning! Nice effort! 📚",
  "Don't worry, practice makes perfect! 🎯",
  "Let's try that again! You can do it! 🤗"
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadProgress();
  setupEventListeners();
  loadSamplePassage();
  updateWordBankDisplay();
});

function setupEventListeners() {
  // File upload
  document.getElementById('pdf-file').addEventListener('change', handleFileUpload);
  document.getElementById('btn-sample').addEventListener('click', loadSamplePassage);

  // Difficulty selection
  document.querySelectorAll('.btn-difficulty').forEach(btn => {
    btn.addEventListener('click', () => setDifficulty(btn.dataset.level));
  });

  // Navigation
  document.getElementById('btn-back-upload').addEventListener('click', () => showScreen('screen-upload'));
  document.getElementById('btn-spelling-mode').addEventListener('click', startSpellingTest);
  document.getElementById('btn-revision-mode').addEventListener('click', startRevision);
  document.getElementById('btn-focus-mode').addEventListener('click', startFocusMode);
  document.getElementById('btn-word-bank').addEventListener('click', () => {
    updateWordBankDisplay();
    showScreen('screen-wordbank');
  });

  // Teacher dashboard
  document.getElementById('btn-teacher').addEventListener('click', showTeacherDashboard);
  document.getElementById('btn-back-from-teacher').addEventListener('click', () => showScreen('screen-upload'));
  document.getElementById('btn-export-data').addEventListener('click', exportProgressData);

  // Modal
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-speak-word').addEventListener('click', speakCurrentWord);
  document.getElementById('btn-blend').addEventListener('click', blendCurrentWord);
  document.getElementById('btn-learn-spelling').addEventListener('click', showSpellingTutorial);
  document.getElementById('btn-test-spelling').addEventListener('click', () => {
    closeModal();
    startSpellingTest();
  });
  document.getElementById('btn-add-wordbank').addEventListener('click', addToWordBank);

  // Focus mode
  document.getElementById('btn-back-from-focus').addEventListener('click', () => showScreen('screen-reading'));
  document.getElementById('btn-focus-speak').addEventListener('click', speakFocusWord);
  document.getElementById('btn-focus-blend').addEventListener('click', blendFocusWord);
  document.getElementById('btn-focus-repeat').addEventListener('click', repeatFocusWord);
  document.getElementById('btn-focus-prev').addEventListener('click', prevFocusWord);
  document.getElementById('btn-focus-next').addEventListener('click', nextFocusWord);

  // Word bank
  document.getElementById('btn-back-from-wordbank').addEventListener('click', () => showScreen('screen-reading'));
  document.getElementById('btn-practice-wordbank').addEventListener('click', practiceWordBank);
  document.getElementById('btn-clear-wordbank').addEventListener('click', clearWordBank);

  // Spelling tutorial
  document.getElementById('btn-back-from-tutorial').addEventListener('click', () => showScreen('screen-reading'));
  document.getElementById('btn-play-spelling').addEventListener('click', playSpellingAnimation);
  document.getElementById('btn-replay-spelling').addEventListener('click', playSpellingAnimation);

  // Spelling test
  document.getElementById('btn-back-from-test').addEventListener('click', () => {
    dictationWords = [];
    dictationIndex = 0;
    dictationScore = 0;
    dictationTotal = 0;
    showScreen('screen-reading');
  });
  document.getElementById('btn-hear-test-word').addEventListener('click', speakTestWord);
  document.getElementById('btn-check-answer').addEventListener('click', checkSpellingAnswer);
  document.getElementById('btn-next-word').addEventListener('click', nextSpellingWord);
  document.getElementById('btn-finish-test').addEventListener('click', showResults);

  // Revision
  document.getElementById('btn-back-from-revision').addEventListener('click', () => showScreen('screen-reading'));
  document.getElementById('btn-check-revision').addEventListener('click', checkRevision);
  document.getElementById('btn-show-answers').addEventListener('click', showRevisionAnswers);

  // Results
  document.getElementById('btn-practice-again').addEventListener('click', () => showScreen('screen-reading'));
  document.getElementById('btn-new-passage').addEventListener('click', () => showScreen('screen-upload'));

  // Settings
  document.getElementById('btn-settings').addEventListener('click', () => showScreen('screen-settings'));
  document.getElementById('btn-settings-reading').addEventListener('click', () => showScreen('screen-settings'));
  document.getElementById('btn-back-from-settings').addEventListener('click', () => {
    if (passageWords.length > 0) {
      showScreen('screen-reading');
    } else {
      showScreen('screen-upload');
    }
  });
  document.querySelectorAll('.btn-setting[data-rate]').forEach(btn => {
    btn.addEventListener('click', () => setSpeechRate(parseFloat(btn.dataset.rate)));
  });
  document.querySelectorAll('.btn-setting[data-size]').forEach(btn => {
    btn.addEventListener('click', () => setTextSize(btn.dataset.size));
  });
  document.querySelectorAll('.btn-setting[data-repeat]').forEach(btn => {
    btn.addEventListener('click', () => setRepetitionCount(parseInt(btn.dataset.repeat)));
  });
  document.getElementById('btn-contrast').addEventListener('click', toggleHighContrast);
  document.getElementById('btn-focus-setting').addEventListener('click', toggleFocusMode);

  // Enter key for test input
  document.getElementById('test-answer').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkSpellingAnswer();
  });

  // Dictation mode
  document.getElementById('btn-dictation-mode').addEventListener('click', startDictationSetup);
  document.querySelectorAll('.btn-dictation-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-dictation-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  document.querySelectorAll('.btn-speed').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-speed').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  document.getElementById('btn-start-dictation').addEventListener('click', startDictationQuiz);

  // Hint buttons
  document.getElementById('btn-hint-chinese').addEventListener('click', showChineseHint);
  document.getElementById('btn-hint-first').addEventListener('click', showFirstLetterHint);
  document.getElementById('btn-hint-length').addEventListener('click', showLengthHint);
  document.getElementById('btn-hint-syllable').addEventListener('click', showSyllableHint);
}

// Settings management
function loadSettings() {
  const saved = localStorage.getItem('senSettings');
  if (saved) {
    settings = { ...settings, ...JSON.parse(saved) };
  }
  applySettings();
}

function saveSettings() {
  localStorage.setItem('senSettings', JSON.stringify(settings));
}

function applySettings() {
  // Speech rate
  document.querySelectorAll('.btn-setting[data-rate]').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.rate) === settings.speechRate);
  });

  // Text size
  document.body.classList.remove('text-small', 'text-medium', 'text-large');
  document.body.classList.add(`text-${settings.textSize}`);
  document.querySelectorAll('.btn-setting[data-size]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === settings.textSize);
  });

  // Repetition count
  document.querySelectorAll('.btn-setting[data-repeat]').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.repeat) === settings.repetitionCount);
  });

  // High contrast
  document.body.classList.toggle('high-contrast', settings.highContrast);
}

function setSpeechRate(rate) {
  settings.speechRate = rate;
  saveSettings();
  applySettings();
  speak(`Speech rate set to ${rate === 0.5 ? 'slow' : rate === 0.7 ? 'normal' : 'fast'}`, rate);
}

function setTextSize(size) {
  settings.textSize = size;
  saveSettings();
  applySettings();
}

function setRepetitionCount(count) {
  settings.repetitionCount = count;
  saveSettings();
  applySettings();
  speak(`Repetition set to ${count} times`, settings.speechRate);
}

function toggleHighContrast() {
  settings.highContrast = !settings.highContrast;
  saveSettings();
  applySettings();
}

function toggleFocusMode() {
  settings.focusMode = !settings.focusMode;
  saveSettings();
  applySettings();
  if (settings.focusMode) {
    startFocusMode();
  }
}

// Screen management
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// File upload handler
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + ' ';
    }

    processPassage(fullText.trim());
  } catch (error) {
    alert('Error reading PDF. Please make sure it is a valid PDF file.');
    console.error(error);
  }
}

// Load sample passage based on difficulty
function loadSamplePassage() {
  const passages = SAMPLE_PASSAGES[currentDifficulty];
  const randomPassage = passages[Math.floor(Math.random() * passages.length)];
  currentPassageTitle = randomPassage.title;
  processPassage(randomPassage.text);
}

// Set difficulty level
function setDifficulty(level) {
  currentDifficulty = level;
  document.querySelectorAll('.btn-difficulty').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.level === level);
  });
  speak(`Difficulty set to ${level}`, settings.speechRate);
}

// Progress tracking
function loadProgress() {
  const saved = localStorage.getItem('studentProgress');
  if (saved) {
    progress = { ...progress, ...JSON.parse(saved) };
  }
}

function saveProgress() {
  localStorage.setItem('studentProgress', JSON.stringify(progress));
}

function trackWordLearned(word) {
  if (!learnedWords.has(word)) {
    learnedWords.add(word);
    progress.totalWordsLearned = learnedWords.size;
    saveProgress();
  }
}

function trackTestScore(type, score, total) {
  const percentage = Math.round((score / total) * 100);
  if (type === 'spelling') {
    progress.spellingScores.push(percentage);
  } else {
    progress.revisionScores.push(percentage);
  }
  saveProgress();
}

function trackDifficultWord(word) {
  if (!progress.difficultWords.includes(word)) {
    progress.difficultWords.push(word);
    saveProgress();
  }
}

function trackActivity(action) {
  progress.recentActivity.unshift({
    action: action,
    time: new Date().toLocaleString()
  });
  if (progress.recentActivity.length > 10) {
    progress.recentActivity.pop();
  }
  saveProgress();
}

function trackSession() {
  progress.totalSessions++;
  progress.progressHistory.push({
    date: new Date().toLocaleDateString(),
    wordsLearned: learnedWords.size,
    stars: totalStars
  });
  saveProgress();
}

// Teacher dashboard
function showTeacherDashboard() {
  updateTeacherStats();
  updateTeacherDifficultWords();
  updateTeacherRecentActivity();
  updateTeacherProgressChart();
  showScreen('screen-teacher');
}

function updateTeacherStats() {
  document.getElementById('stat-total-words').textContent = progress.totalWordsLearned;
  
  const allScores = [...progress.spellingScores, ...progress.revisionScores];
  const avgScore = allScores.length > 0 
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) 
    : 0;
  document.getElementById('stat-avg-score').textContent = avgScore + '%';
  
  document.getElementById('stat-sessions').textContent = progress.totalSessions;
  document.getElementById('stat-stars').textContent = progress.totalStars;
}

function updateTeacherDifficultWords() {
  const container = document.getElementById('teacher-difficult-words');
  if (progress.difficultWords.length === 0) {
    container.innerHTML = '<p class="teacher-empty">No difficult words recorded yet.</p>';
    return;
  }
  container.innerHTML = '';
  progress.difficultWords.slice(0, 10).forEach(word => {
    const dictEntry = DICTIONARY[word] || { chinese: word };
    const emoji = EMOJI_MAP[word] || '📝';
    const item = document.createElement('div');
    item.className = 'teacher-word-item';
    item.innerHTML = `<span>${emoji} ${word} (${dictEntry.chinese})</span>`;
    container.appendChild(item);
  });
}

function updateTeacherRecentActivity() {
  const container = document.getElementById('teacher-recent-activity');
  if (progress.recentActivity.length === 0) {
    container.innerHTML = '<p class="teacher-empty">No recent activity.</p>';
    return;
  }
  container.innerHTML = '';
  progress.recentActivity.forEach(activity => {
    const item = document.createElement('div');
    item.className = 'teacher-activity-item';
    item.innerHTML = `<span>${activity.action}</span><span class="activity-time">${activity.time}</span>`;
    container.appendChild(item);
  });
}

function updateTeacherProgressChart() {
  const container = document.getElementById('teacher-progress-chart');
  if (progress.progressHistory.length === 0) {
    container.innerHTML = '<p class="teacher-empty">No progress data yet. Complete some sessions!</p>';
    return;
  }
  
  // Simple bar chart
  const maxWords = Math.max(...progress.progressHistory.map(h => h.wordsLearned), 1);
  container.innerHTML = '<div class="progress-bars">';
  progress.progressHistory.slice(-7).forEach(entry => {
    const height = (entry.wordsLearned / maxWords) * 100;
    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    bar.style.height = height + '%';
    bar.title = `${entry.date}: ${entry.wordsLearned} words`;
    container.appendChild(bar);
  });
  container.innerHTML += '</div>';
}

function exportProgressData() {
  const data = JSON.stringify(progress, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'student-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Process passage text into words
function processPassage(text) {
  const tokens = text.match(/[\w']+|[.,!?;:""''()\-]/g) || [];
  passageWords = tokens.map((token, index) => ({
    text: token,
    index: index,
    isWord: /^[a-zA-Z']+$/.test(token),
    learned: false
  }));

  displayPassage();
  showScreen('screen-reading');
  updateProgress();
}

// Display passage with clickable words
function displayPassage() {
  const container = document.getElementById('passage-text');
  container.innerHTML = '';

  passageWords.forEach((wordObj, idx) => {
    const span = document.createElement('span');
    span.textContent = wordObj.text;
    span.className = 'passage-word';

    if (wordObj.isWord) {
      if (wordObj.learned) {
        span.classList.add('learned');
      }
      if (wordBank.includes(wordObj.text.toLowerCase())) {
        span.classList.add('in-wordbank');
      }
      span.addEventListener('click', () => showWordDetail(wordObj.text, span));
    } else {
      span.classList.add('punctuation');
    }

    container.appendChild(span);

    if (idx < passageWords.length - 1) {
      const nextWord = passageWords[idx + 1];
      if (!/^[.,!?;:""''()\-]$/.test(nextWord.text)) {
        container.appendChild(document.createTextNode(' '));
      }
    }
  });
}

// Show word detail modal
function showWordDetail(word, element) {
  currentWord = word;
  const lowerWord = word.toLowerCase();

  // Mark as learned
  const wordObj = passageWords.find(w => w.text.toLowerCase() === lowerWord);
  if (wordObj && !wordObj.learned) {
    wordObj.learned = true;
    learnedWords.add(lowerWord);
    element.classList.add('learned');
    updateProgress();
  }

  // Get dictionary info
  const dictEntry = DICTIONARY[lowerWord] || {
    chinese: '(Not in dictionary - ask your teacher!)',
    pos: '?'
  };

  // Get emoji
  const emoji = EMOJI_MAP[lowerWord] || '📝';

  // Update modal
  document.getElementById('modal-emoji').textContent = emoji;
  document.getElementById('modal-word').textContent = word;
  document.getElementById('modal-chinese').textContent = dictEntry.chinese;
  document.getElementById('modal-pos').textContent = dictEntry.pos;
  document.getElementById('modal-phonics').textContent = getPhonicsDisplay(word);

  // Display syllables in different colors
  const syllablesContainer = document.getElementById('syllables-display');
  syllablesContainer.innerHTML = '';
  const syllables = getSyllablesWithColors(word);
  syllables.forEach(syllable => {
    const span = document.createElement('span');
    span.className = 'syllable-chunk';
    span.textContent = syllable.text;
    span.style.backgroundColor = syllable.color + '20';
    span.style.color = syllable.color;
    span.style.border = `2px solid ${syllable.color}`;
    span.addEventListener('click', () => speakSyllable(syllable.text));
    syllablesContainer.appendChild(span);
  });

  // Display phonics chunks with sounds
  const chunksContainer = document.getElementById('phonics-chunks');
  chunksContainer.innerHTML = '';
  const chunks = getPhonicsChunks(word);
  chunks.forEach(chunk => {
    const span = document.createElement('span');
    span.className = `phonics-chunk ${chunk.type}`;
    span.textContent = chunk.text;
    span.title = `Sound: /${chunk.sound}/`;
    span.addEventListener('click', () => speakPhonicsChunk(chunk.text));
    chunksContainer.appendChild(span);
  });

  // Show modal
  document.getElementById('word-modal').classList.add('active');
}

// Close modal
function closeModal() {
  document.getElementById('word-modal').classList.remove('active');
  currentWord = null;
}

// Update progress counter
function updateProgress() {
  const totalWords = passageWords.filter(w => w.isWord).length;
  const uniqueWords = new Set(passageWords.filter(w => w.isWord).map(w => w.text.toLowerCase()));
  document.getElementById('words-learned').textContent = learnedWords.size;
  document.getElementById('words-total').textContent = uniqueWords.size;
}

// Speech synthesis with SEN settings
function speak(text, rate = null) {
  if (!('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate || settings.speechRate;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

function speakCurrentWord() {
  if (currentWord) {
    // Repeat based on settings
    for (let i = 0; i < settings.repetitionCount; i++) {
      setTimeout(() => speak(currentWord, settings.speechRate), i * 1500);
    }
  }
}

function speakPhonicsChunk(chunk) {
  // Use phonetic sound if available, otherwise use the chunk text
  const sound = getGraphemeSound(chunk);
  speak(sound, settings.speechRate * 0.7);
}

function speakSyllable(syllable) {
  // Speak the syllable with its phonics chunks
  const chunks = blendWord(syllable);
  let delay = 0;
  chunks.forEach(chunk => {
    setTimeout(() => {
      const sound = getGraphemeSound(chunk);
      speak(sound, settings.speechRate * 0.6);
    }, delay);
    delay += 400;
  });
  // Speak the full syllable at the end
  setTimeout(() => {
    speak(syllable, settings.speechRate * 0.8);
  }, delay + 200);
}

function blendCurrentWord() {
  if (!currentWord) return;
  const chunks = blendWord(currentWord);
  let delay = 0;
  chunks.forEach((chunk) => {
    setTimeout(() => {
      speak(chunk, settings.speechRate * 0.6);
    }, delay);
    delay += 500;
  });
  setTimeout(() => {
    speak(currentWord, settings.speechRate);
  }, delay + 300);
}

// Focus Mode (SEN feature)
function startFocusMode() {
  // Get unique words from passage
  const uniqueWords = [...new Set(passageWords.filter(w => w.isWord).map(w => w.text.toLowerCase()))];
  focusModeWords = shuffleArray(uniqueWords).slice(0, Math.min(10, uniqueWords.length));
  focusModeIndex = 0;

  showScreen('screen-focus');
  displayFocusWord();
}

function displayFocusWord() {
  if (focusModeIndex >= focusModeWords.length) {
    showResults();
    return;
  }

  const word = focusModeWords[focusModeIndex];
  const dictEntry = DICTIONARY[word] || { chinese: word, pos: '?' };
  const emoji = EMOJI_MAP[word] || '📝';

  document.getElementById('focus-current').textContent = focusModeIndex + 1;
  document.getElementById('focus-total').textContent = focusModeWords.length;
  document.getElementById('focus-emoji').textContent = emoji;
  document.getElementById('focus-word').textContent = word;
  document.getElementById('focus-phonics').textContent = getPhonicsDisplay(word);
  document.getElementById('focus-chinese').textContent = dictEntry.chinese;
  document.getElementById('focus-pos').textContent = dictEntry.pos;

  // Display syllables in different colors
  const syllablesContainer = document.getElementById('focus-syllables');
  syllablesContainer.innerHTML = '';
  const syllables = getSyllablesWithColors(word);
  syllables.forEach(syllable => {
    const span = document.createElement('span');
    span.className = 'syllable-chunk';
    span.textContent = syllable.text;
    span.style.backgroundColor = syllable.color + '20';
    span.style.color = syllable.color;
    span.style.border = `2px solid ${syllable.color}`;
    span.addEventListener('click', () => speakSyllable(syllable.text));
    syllablesContainer.appendChild(span);
  });

  // Display phonics chunks with sounds
  const chunksContainer = document.getElementById('focus-phonics-chunks');
  chunksContainer.innerHTML = '';
  const chunks = getPhonicsChunks(word);
  chunks.forEach(chunk => {
    const span = document.createElement('span');
    span.className = `phonics-chunk ${chunk.type}`;
    span.textContent = chunk.text;
    span.title = `Sound: /${chunk.sound}/`;
    span.addEventListener('click', () => speakPhonicsChunk(chunk.text));
    chunksContainer.appendChild(span);
  });

  // Auto-speak the word
  setTimeout(() => speak(word, settings.speechRate), 500);
}

function speakFocusWord() {
  if (focusModeIndex < focusModeWords.length) {
    speak(focusModeWords[focusModeIndex], settings.speechRate);
  }
}

function blendFocusWord() {
  if (focusModeIndex >= focusModeWords.length) return;
  const word = focusModeWords[focusModeIndex];
  const chunks = blendWord(word);
  let delay = 0;
  chunks.forEach((chunk) => {
    setTimeout(() => {
      const sound = getGraphemeSound(chunk);
      speak(sound, settings.speechRate * 0.5);
    }, delay);
    delay += 500;
  });
  setTimeout(() => {
    speak(word, settings.speechRate);
  }, delay + 300);
}

function repeatFocusWord() {
  if (focusModeIndex < focusModeWords.length) {
    for (let i = 0; i < settings.repetitionCount; i++) {
      setTimeout(() => speak(focusModeWords[focusModeIndex], settings.speechRate), i * 1500);
    }
  }
}

function prevFocusWord() {
  if (focusModeIndex > 0) {
    focusModeIndex--;
    displayFocusWord();
  }
}

function nextFocusWord() {
  if (focusModeIndex < focusModeWords.length - 1) {
    focusModeIndex++;
    displayFocusWord();
  } else {
    showResults();
  }
}

// Word Bank (SEN feature)
function addToWordBank() {
  if (!currentWord) return;
  const lowerWord = currentWord.toLowerCase();

  if (!wordBank.includes(lowerWord)) {
    wordBank.push(lowerWord);
    saveWordBank();
    updateWordBankDisplay();
    displayPassage(); // Refresh to show wordbank indicator

    // Show encouragement
    const btn = document.getElementById('btn-add-wordbank');
    const originalText = btn.textContent;
    btn.textContent = '✅ Saved!';
    setTimeout(() => { btn.textContent = originalText; }, 1500);

    speak('Word saved to your word bank!', settings.speechRate);
  }
}

function removeFromWordBank(word) {
  wordBank = wordBank.filter(w => w !== word);
  saveWordBank();
  updateWordBankDisplay();
  displayPassage();
}

function saveWordBank() {
  localStorage.setItem('wordBank', JSON.stringify(wordBank));
}

function loadWordBank() {
  const saved = localStorage.getItem('wordBank');
  if (saved) {
    wordBank = JSON.parse(saved);
  }
}

function updateWordBankDisplay() {
  loadWordBank();
  const container = document.getElementById('wordbank-list');
  const countEl = document.getElementById('wordbank-count');

  countEl.textContent = wordBank.length;

  if (wordBank.length === 0) {
    container.innerHTML = '<div class="wordbank-empty">No words saved yet.<br>Click on words in the passage and save them here for extra practice!</div>';
    return;
  }

  container.innerHTML = '';
  wordBank.forEach(word => {
    const dictEntry = DICTIONARY[word] || { chinese: word };
    const emoji = EMOJI_MAP[word] || '📝';

    const item = document.createElement('div');
    item.className = 'wordbank-item';
    item.innerHTML = `
      <button class="wb-remove" onclick="removeFromWordBank('${word}')">&times;</button>
      <div class="wb-emoji">${emoji}</div>
      <div class="wb-word">${word}</div>
      <div class="wb-chinese">${dictEntry.chinese}</div>
    `;
    container.appendChild(item);
  });
}

function practiceWordBank() {
  if (wordBank.length === 0) {
    alert('Your word bank is empty. Save some words first!');
    return;
  }

  spellingTestWords = shuffleArray([...wordBank]);
  spellingTestIndex = 0;
  spellingScore = 0;
  spellingTotal = spellingTestWords.length;

  showScreen('screen-spelling-test');
  showSpellingTestQuestion();
}

function clearWordBank() {
  if (confirm('Are you sure you want to clear all saved words?')) {
    wordBank = [];
    saveWordBank();
    updateWordBankDisplay();
    displayPassage();
  }
}

// Spelling Tutorial (Video-like animation)
function showSpellingTutorial() {
  closeModal();
  showScreen('screen-spelling-tutorial');
  playSpellingAnimation();
}

function playSpellingAnimation() {
  const display = document.getElementById('spelling-display');
  const hint = document.getElementById('spelling-hint');
  display.innerHTML = '';
  hint.textContent = '';

  if (!currentWord) return;

  const letters = currentWord.split('');

  // Show letters one by one
  letters.forEach((letter, i) => {
    setTimeout(() => {
      const span = document.createElement('span');
      span.className = 'spelling-letter';
      span.textContent = letter;
      span.style.animationDelay = '0s';
      display.appendChild(span);
      speak(letter, settings.speechRate * 0.8);
    }, i * 700);
  });

  // Show full word at the end
  setTimeout(() => {
    hint.textContent = `The word is: ${currentWord}`;
    speak(currentWord, settings.speechRate);
  }, letters.length * 700 + 400);
}

// Spelling Test
function startSpellingTest() {
  // Reset dictation state
  dictationWords = [];
  dictationIndex = 0;
  dictationScore = 0;
  dictationTotal = 0;

  document.getElementById('test-title').textContent = '✏️ Spelling Practice';
  document.getElementById('dictation-setup').style.display = 'none';
  document.getElementById('test-area').style.display = 'block';

  const uniqueWords = [...new Set(passageWords.filter(w => w.isWord).map(w => w.text.toLowerCase()))];
  spellingTestWords = shuffleArray(uniqueWords).slice(0, Math.min(10, uniqueWords.length));
  spellingTestIndex = 0;
  spellingScore = 0;
  spellingTotal = spellingTestWords.length;

  showScreen('screen-spelling-test');
  showSpellingTestQuestion();
}

function showSpellingTestQuestion() {
  if (spellingTestIndex >= spellingTestWords.length) {
    showResults();
    return;
  }

  const word = spellingTestWords[spellingTestIndex];
  const dictEntry = DICTIONARY[word] || { chinese: word };
  const emoji = EMOJI_MAP[word] || '📝';

  document.getElementById('test-chinese-hint').textContent = dictEntry.chinese;
  document.getElementById('test-emoji-hint').textContent = emoji;
  document.getElementById('test-answer').value = '';
  document.getElementById('test-feedback').textContent = '';
  document.getElementById('test-feedback').className = 'test-feedback';
  document.getElementById('test-stars').textContent = '';
  document.getElementById('test-score').textContent = spellingScore;

  // Auto-speak the word
  setTimeout(() => speak(word, settings.speechRate), 500);
}

function speakTestWord() {
  if (dictationWords.length > 0 && document.getElementById('test-area').style.display !== 'none') {
    speakDictationWord();
  } else if (spellingTestIndex < spellingTestWords.length) {
    speak(spellingTestWords[spellingTestIndex], settings.speechRate);
  }
}

function checkSpellingAnswer() {
  // Route to dictation check if in dictation mode
  if (dictationWords.length > 0 && document.getElementById('test-area').style.display !== 'none') {
    checkDictationAnswer();
    return;
  }

  const input = document.getElementById('test-answer');
  const feedback = document.getElementById('test-feedback');
  const starsContainer = document.getElementById('test-stars');
  const userAnswer = input.value.trim().toLowerCase();
  const correctAnswer = spellingTestWords[spellingTestIndex];

  if (userAnswer === correctAnswer) {
    const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    feedback.textContent = `${encouragement} Correct!`;
    feedback.className = 'test-feedback correct';
    starsContainer.textContent = '⭐';
    spellingScore++;
    totalStars++;
    document.getElementById('test-score').textContent = spellingScore;

    // Add star animation
    starsContainer.style.animation = 'none';
    starsContainer.offsetHeight; // Trigger reflow
    starsContainer.style.animation = 'starPop 0.5s ease';
  } else {
    const tryAgain = TRY_AGAIN_MESSAGES[Math.floor(Math.random() * TRY_AGAIN_MESSAGES.length)];
    feedback.textContent = `${tryAgain} The word is: ${correctAnswer}`;
    feedback.className = 'test-feedback incorrect';
    starsContainer.textContent = '';
  }

  // Move to next word after delay
  setTimeout(() => {
    spellingTestIndex++;
    showSpellingTestQuestion();
  }, 2500);
}

function nextSpellingWord() {
  if (dictationWords.length > 0 && document.getElementById('test-area').style.display !== 'none') {
    dictationIndex++;
    showDictationQuestion();
  } else {
    spellingTestIndex++;
    showSpellingTestQuestion();
  }
}

// ==================== DICTATION QUIZ MODE ====================

let dictationWords = [];
let dictationIndex = 0;
let dictationScore = 0;
let dictationTotal = 0;
let dictationAudioRate = 0.7;
let dictationUseContext = true;
let dictationWordSelection = 'all';
let currentHints = [];

function startDictationSetup() {
  document.getElementById('test-title').textContent = '🎧 Dictation Quiz';
  document.getElementById('dictation-setup').style.display = 'block';
  document.getElementById('test-area').style.display = 'none';
  showScreen('screen-spelling-test');
}

function startDictationQuiz() {
  // Get selected options
  document.querySelectorAll('.btn-dictation-option').forEach(btn => {
    if (btn.classList.contains('active')) {
      dictationWordSelection = btn.dataset.selection;
    }
  });
  document.querySelectorAll('.btn-speed').forEach(btn => {
    if (btn.classList.contains('active')) {
      dictationAudioRate = parseFloat(btn.dataset.speed);
    }
  });
  dictationUseContext = document.getElementById('chk-sentence-context').checked;

  // Select words based on choice
  const allUniqueWords = [...new Set(passageWords.filter(w => w.isWord).map(w => w.text.toLowerCase()))];

  switch (dictationWordSelection) {
    case 'starred':
      dictationWords = allUniqueWords.filter(w => wordBank.includes(w));
      if (dictationWords.length === 0) {
        alert('No starred words yet! Star some words first by clicking "Save to Word Bank".');
        return;
      }
      break;
    case 'random':
      dictationWords = shuffleArray(allUniqueWords).slice(0, Math.min(10, allUniqueWords.length));
      break;
    default:
      dictationWords = shuffleArray(allUniqueWords);
  }

  dictationIndex = 0;
  dictationScore = 0;
  dictationTotal = dictationWords.length;

  document.getElementById('dictation-setup').style.display = 'none';
  document.getElementById('test-area').style.display = 'block';
  document.getElementById('test-score').textContent = '0';

  showDictationQuestion();
}

function showDictationQuestion() {
  if (dictationIndex >= dictationWords.length) {
    showDictationResults();
    return;
  }

  const word = dictationWords[dictationIndex];
  const dictEntry = DICTIONARY[word] || { chinese: word };
  const emoji = EMOJI_MAP[word] || '📝';

  // Reset hints
  currentHints = [];
  document.getElementById('hint-display').textContent = '';
  document.getElementById('test-chinese-hint').textContent = dictEntry.chinese;
  document.getElementById('test-emoji-hint').textContent = emoji;
  document.getElementById('test-answer').value = '';
  document.getElementById('test-feedback').textContent = '';
  document.getElementById('test-feedback').className = 'test-feedback';
  document.getElementById('test-stars').textContent = '';

  // Show sentence context if enabled
  const contextEl = document.getElementById('sentence-context');
  if (dictationUseContext) {
    const sentence = findSentenceForWord(word);
    if (sentence) {
      contextEl.innerHTML = `<p class="context-label">Sentence:</p><p class="context-text">${sentence}</p>`;
    } else {
      contextEl.innerHTML = '';
    }
  } else {
    contextEl.innerHTML = '';
  }

  // Auto-play the word
  setTimeout(() => speak(word, dictationAudioRate), 500);
}

function findSentenceForWord(word) {
  // Reconstruct sentences from passageWords
  let sentences = [];
  let currentSentence = [];

  passageWords.forEach(w => {
    currentSentence.push(w.text);
    if (/^[.!?]$/.test(w.text)) {
      sentences.push(currentSentence.join(' '));
      currentSentence = [];
    }
  });
  if (currentSentence.length > 0) {
    sentences.push(currentSentence.join(' '));
  }

  // Find sentence containing the word
  const lowerWord = word.toLowerCase();
  for (const sentence of sentences) {
    const words = sentence.toLowerCase().match(/[\w']+/g) || [];
    if (words.includes(lowerWord)) {
      // Replace the target word with blanks
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      return sentence.replace(regex, '______');
    }
  }
  return null;
}

function speakDictationWord() {
  if (dictationIndex < dictationWords.length) {
    speak(dictationWords[dictationIndex], dictationAudioRate);
  }
}

// Hint system
function showChineseHint() {
  if (dictationIndex >= dictationWords.length) return;
  const word = dictationWords[dictationIndex];
  const dictEntry = DICTIONARY[word] || { chinese: word };
  const hintEl = document.getElementById('hint-display');
  hintEl.innerHTML = `<span class="hint-item">💡 Chinese: <strong>${dictEntry.chinese}</strong></span>`;
  currentHints.push('chinese');
}

function showFirstLetterHint() {
  if (dictationIndex >= dictationWords.length) return;
  const word = dictationWords[dictationIndex];
  const hintEl = document.getElementById('hint-display');
  hintEl.innerHTML = `<span class="hint-item">🔤 First letter: <strong>${word[0].toUpperCase()}</strong></span>`;
  currentHints.push('first');
}

function showLengthHint() {
  if (dictationIndex >= dictationWords.length) return;
  const word = dictationWords[dictationIndex];
  const hintEl = document.getElementById('hint-display');
  hintEl.innerHTML = `<span class="hint-item">📏 Length: <strong>${word.length} letters</strong></span>`;
  currentHints.push('length');
}

function showSyllableHint() {
  if (dictationIndex >= dictationWords.length) return;
  const word = dictationWords[dictationIndex];
  const syllables = splitSyllables(word);
  const hintEl = document.getElementById('hint-display');
  hintEl.innerHTML = `<span class="hint-item">🔊 Syllables: <strong>${syllables.length}</strong> (${syllables.join('-')})</span>`;
  currentHints.push('syllable');
}

function checkDictationAnswer() {
  const input = document.getElementById('test-answer');
  const feedback = document.getElementById('test-feedback');
  const starsContainer = document.getElementById('test-stars');
  const userAnswer = input.value.trim().toLowerCase();
  const correctAnswer = dictationWords[dictationIndex];

  if (userAnswer === correctAnswer) {
    const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    feedback.textContent = `${encouragement} Correct!`;
    feedback.className = 'test-feedback correct';
    starsContainer.textContent = '⭐';
    dictationScore++;
    totalStars++;
    document.getElementById('test-score').textContent = dictationScore;

    starsContainer.style.animation = 'none';
    starsContainer.offsetHeight;
    starsContainer.style.animation = 'starPop 0.5s ease';
  } else {
    const tryAgain = TRY_AGAIN_MESSAGES[Math.floor(Math.random() * TRY_AGAIN_MESSAGES.length)];
    // Show the correct answer with letter-by-letter highlighting
    const diff = highlightDifferences(userAnswer, correctAnswer);
    feedback.innerHTML = `${tryAgain}<br>The word is: <strong>${diff}</strong>`;
    feedback.className = 'test-feedback incorrect';
    starsContainer.textContent = '';
    trackDifficultWord(correctAnswer);
  }

  // Track dictation score
  trackTestScore('dictation', dictationScore, dictationTotal);

  setTimeout(() => {
    dictationIndex++;
    showDictationQuestion();
  }, 3000);
}

function highlightDifferences(userAnswer, correctAnswer) {
  let result = '';
  const maxLen = Math.max(userAnswer.length, correctAnswer.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < userAnswer.length && i < correctAnswer.length) {
      if (userAnswer[i] === correctAnswer[i]) {
        result += correctAnswer[i];
      } else {
        result += `<span class="letter-wrong">${correctAnswer[i]}</span>`;
      }
    } else if (i < correctAnswer.length) {
      result += `<span class="letter-missing">${correctAnswer[i]}</span>`;
    }
  }
  return result;
}

function showDictationResults() {
  const percentage = Math.round((dictationScore / dictationTotal) * 100);

  document.getElementById('result-words').textContent = learnedWords.size;
  document.getElementById('result-spelling').textContent = `${dictationScore}/${dictationTotal} (${percentage}%)`;
  document.getElementById('result-revision').textContent = `${revisionScore}/${revisionTotal}`;
  document.getElementById('result-stars').textContent = `${totalStars} ⭐`;

  const starsContainer = document.getElementById('results-stars');
  starsContainer.textContent = '⭐'.repeat(Math.min(dictationScore, 10));

  // Track session
  trackSession();
  trackActivity(`Dictation Quiz: ${dictationScore}/${dictationTotal} (${percentage}%)`);

  showScreen('screen-results');
}

// Passage Revision
function startRevision() {
  const wordIndices = passageWords
    .map((w, i) => ({ ...w, originalIndex: i }))
    .filter(w => w.isWord);

  const wordsToBlank = wordIndices.filter((_, i) => i % 3 === 0);
  revisionAnswers = wordsToBlank.map(w => ({
    answer: w.text.toLowerCase(),
    userAnswer: '',
    element: null
  }));
  revisionTotal = revisionAnswers.length;
  revisionScore = 0;

  displayRevisionPassage();
  showScreen('screen-revision');
}

function displayRevisionPassage() {
  const container = document.getElementById('revision-passage');
  container.innerHTML = '';

  passageWords.forEach((wordObj) => {
    if (wordObj.isWord) {
      const lowerWord = wordObj.text.toLowerCase();
      const answerIdx = revisionAnswers.findIndex(r => r.answer === lowerWord && !r.element);

      if (answerIdx !== -1) {
        const blank = document.createElement('span');
        blank.className = 'revision-blank';
        blank.contentEditable = true;
        blank.dataset.index = answerIdx;
        blank.textContent = '???';
        blank.addEventListener('input', (e) => {
          revisionAnswers[answerIdx].userAnswer = e.target.textContent.trim().toLowerCase();
        });
        revisionAnswers[answerIdx].element = blank;
        container.appendChild(blank);
      } else {
        const span = document.createElement('span');
        span.textContent = wordObj.text;
        container.appendChild(span);
      }
    } else {
      const span = document.createElement('span');
      span.textContent = wordObj.text;
      container.appendChild(span);
    }

    const nextIdx = passageWords.indexOf(wordObj) + 1;
    if (nextIdx < passageWords.length) {
      const nextWord = passageWords[nextIdx];
      if (!/^[.,!?;:""''()\-]$/.test(nextWord.text)) {
        container.appendChild(document.createTextNode(' '));
      }
    }
  });
}

function checkRevision() {
  let correct = 0;
  revisionAnswers.forEach(answer => {
    if (answer.userAnswer === answer.answer) {
      answer.element.classList.add('correct');
      answer.element.textContent = answer.answer;
      correct++;
      totalStars++;
    } else {
      answer.element.classList.add('incorrect');
      answer.element.textContent = answer.userAnswer || '???';
    }
  });

  revisionScore = correct;
  document.getElementById('revision-score').textContent = `${correct}/${revisionTotal}`;

  const feedback = document.getElementById('revision-feedback');
  feedback.textContent = `You got ${correct} out of ${revisionTotal} correct!`;
  feedback.style.color = correct === revisionTotal ? 'var(--success)' : 'var(--secondary-dark)';
}

function showRevisionAnswers() {
  revisionAnswers.forEach(answer => {
    answer.element.classList.remove('correct', 'incorrect');
    answer.element.textContent = answer.answer;
  });
}

// Results
function showResults() {
  // If in dictation mode, show dictation results
  if (dictationWords.length > 0 && document.getElementById('test-area').style.display !== 'none') {
    showDictationResults();
    return;
  }

  document.getElementById('result-words').textContent = learnedWords.size;
  document.getElementById('result-spelling').textContent = `${spellingScore}/${spellingTotal}`;
  document.getElementById('result-revision').textContent = `${revisionScore}/${revisionTotal}`;
  document.getElementById('result-stars').textContent = `${totalStars} ⭐`;

  // Show stars animation
  const starsContainer = document.getElementById('results-stars');
  starsContainer.textContent = '⭐'.repeat(Math.min(totalStars, 10));

  showScreen('screen-results');
}

// Utility: Shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
