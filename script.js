let quizData = {};
let currentChapter = '';
let currentQuestionIndex = 0;
let score = 0;
let questionAnswered = false;

// Add new variables for tracking correct and incorrect answers
let correctCount = 0;
let incorrectCount = 0;

// Add new variables at the top
let incorrectQuestions = [];
let isRetestMode = false;

// DOM Elements
const chapterSelection = document.getElementById('chapter-selection');
const chaptersList = document.getElementById('chapters-list');
const quizSection = document.getElementById('quiz-section');
const resultSection = document.getElementById('result-section');
const chapterTitle = document.getElementById('chapter-title');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');
const finishBtn = document.getElementById('finish-btn');
const scoreDisplay = document.getElementById('score');
const finalScore = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const sideMenu = document.getElementById('side-menu');
const closeMenu = document.getElementById('close-menu');
const menuOverlay = document.getElementById('menu-overlay');
const menuChaptersList = document.getElementById('menu-chapters-list');
const retestBtn = document.getElementById('retest-btn');
//const prevQuestionBtn = document.getElementById('prev-question');
//const nextQuestionBtn = document.getElementById('next-question');

// Fetch and process CSV data
async function fetchQuizData() {
    try {
        const response = await fetch('quiz_data.csv');
        const csvText = await response.text();
        const questions = parseCSV(csvText);
        organizeQuestionsByChapter(questions);
        initializeChapters();
    } catch (error) {
        console.warn('Falling back to hardcoded data:', error);
        // Fallback data
        quizData = {
            'Chapter 1': [
                {
                    question: 'What is 2 + 2?',
                    options: ['3', '4', '5', '6'],
                    correct: 1,
                    note: 'The sum of 2 and 2 is 4'
                },
                {
                    question: 'What is 5 x 3?',
                    options: ['10', '12', '15', '18'],
                    correct: 2,
                    note: 'Multiplication: 5 x 3 = 15'
                }
            ],
            'Chapter 2': [
                {
                    question: 'What is 12 x 12?',
                    options: ['144', '124', '148', '142'],
                    correct: 0,
                    note: '12 x 12 = 144 (12 times table)'
                },
                {
                    question: 'What is 15 + 25?',
                    options: ['35', '40', '45', '50'],
                    correct: 1,
                    note: 'Simple addition: 15 + 25 = 40'
                }
            ]
        };
        initializeChapters();
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const questions = [];

    console.log('Starting CSV parsing');
    console.log('Headers:', headers);

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        let row = lines[i];
        console.log(`\nProcessing row ${i}:`, row);
        
        let values = [];
        let insideQuotes = false;
        let currentValue = '';
        
        for (let char of row) {
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());

        values = values.map(val => {
            if (val.startsWith('"') && val.endsWith('"')) {
                return val.slice(1, -1);
            }
            return val;
        });

        console.log('Extracted values:', values);

        try {
            // Parse options string into array of objects
            const optionsArray = values[2].split(',').map(opt => {
                const [letter, text] = opt.split(':');
                return {
                    letter: letter,
                    text: text
                };
            });

            const question = {
                chapter: values[0],
                question: values[1],
                options: optionsArray,
                correct: values[3],
                note: values[4]
            };
            console.log('Created question object:', question);
            questions.push(question);
        } catch (e) {
            console.error('Error parsing row:', e);
            console.error('Problematic values:', values);
        }
    }

    console.log('\nFinal questions array:', questions);
    return questions;
}

function organizeQuestionsByChapter(questions) {
    console.log('\nStarting to organize questions by chapter');
    console.log('Input questions:', questions);
    
    quizData = questions.reduce((acc, question) => {
        const chapterNum = question.chapter;
        console.log(`Processing chapter ${chapterNum}`);
        
        if (!acc[chapterNum]) {
            const title = getChapterTitle(chapterNum);
            console.log(`Creating new chapter with title: ${title}`);
            acc[chapterNum] = {
                questions: [],
                title: title
            };
        }
        acc[chapterNum].questions.push(question);
        return acc;
    }, {});
    
    console.log('Final organized quiz data:', quizData);
}

// Add a function to get chapter titles
function getChapterTitle(chapterNum) {
    switch(chapterNum) {
        case "1": return "The California Driver's License";
        case "2": return "Getting an Instruction Permit and Driver's License";
        case "3": return "The Testing Process";
        case "4": return "Changing, Replacing, and Renewing Your Driver's License";
        case "5": return "An Introduction to Driving";
        case "6": return "Navigating the Roads";
        case "7": return "Laws and Rules of the Road";
        case "8": return "Safe Driving";
        case "9": return "Alcohol and Drugs";
        case "10": return "Financial Responsibility, Insurance, Requirements, and Collisions";
        case "11": return "Vehicle Registration Requirements";
        case "12": return "Driver Safety";
        case "13": return "Seniors and Driving";
        case "14": return "Glossary";
        default: return `Chapter ${chapterNum}`;
    }
}

// Modify initializeChapters function
function initializeChapters() {
    Object.keys(quizData).forEach(chapter => {
        // Create button for main chapter list
        const chapterBtn = document.createElement('button');
        chapterBtn.className = 'chapter-btn';
        chapterBtn.textContent = `Chapter ${chapter}: ${quizData[chapter].title}`;
        chapterBtn.addEventListener('click', () => startChapter(chapter));
        chaptersList.appendChild(chapterBtn);

        // Create button for side menu
        const menuChapterBtn = document.createElement('button');
        menuChapterBtn.className = 'menu-chapter-btn';
        menuChapterBtn.textContent = `Chapter ${chapter}: ${quizData[chapter].title}`;
        menuChapterBtn.addEventListener('click', () => {
            startChapter(chapter);
            sideMenu.classList.remove('active');
            menuOverlay.classList.remove('active');
        });
        menuChaptersList.appendChild(menuChapterBtn);
    });
}

// Update startChapter function
function startChapter(chapterNum) {
    currentChapter = chapterNum;
    currentQuestionIndex = 0;
    correctCount = 0;
    incorrectCount = 0;
    scoreDisplay.textContent = `❌: ${incorrectCount}`;
    chapterSelection.classList.add('hidden');
    quizSection.classList.remove('hidden');
    const chapterTitle = quizData[chapterNum].title;
    document.getElementById('chapter-title').textContent = `Chapter ${chapterNum}: ${chapterTitle}`;
    showQuestion();
}

// Update showQuestion function
function showQuestion() {
    questionAnswered = false;
    const question = quizData[currentChapter].questions[currentQuestionIndex];
    const totalQuestions = quizData[currentChapter].questions.length;
    
    // Update progress and score in a single line with colored incorrect count
    const questionProgress = document.getElementById('question-progress');
    questionProgress.innerHTML = `Question ${currentQuestionIndex + 1} of ${totalQuestions}   |   <span class="incorrect-count">Incorrect: ${incorrectCount}</span>`;
    
    // Remove the separate score display
    scoreDisplay.style.display = 'none';
    
    questionText.textContent = question.question;
    optionsContainer.innerHTML = '';
    
    const existingNote = document.getElementById('question-note');
    if (existingNote) {
        existingNote.remove();
    }
    
    question.options.forEach((option) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = `${option.letter.toUpperCase()}. ${option.text}`;
        button.dataset.letter = option.letter;
        button.addEventListener('click', () => checkAnswer(option.letter));
        optionsContainer.appendChild(button);
    });

    // Update navigation buttons
    //prevQuestionBtn.disabled = currentQuestionIndex === 0;
    //nextQuestionBtn.disabled = currentQuestionIndex === quizData[currentChapter].questions.length - 1;

    nextBtn.classList.add('hidden');
    finishBtn.classList.add('hidden');
}

// Update checkAnswer function
function checkAnswer(selectedLetter) {
    if (questionAnswered) return;
    
    questionAnswered = true;
    const question = quizData[currentChapter].questions[currentQuestionIndex];
    const options = optionsContainer.children;

    const selectedButton = Array.from(options).find(
        btn => btn.dataset.letter === selectedLetter
    );
    const correctButton = Array.from(options).find(
        btn => btn.dataset.letter === question.correct
    );

    if (selectedLetter === question.correct) {
        selectedButton.classList.add('correct');
        correctCount++;
    } else {
        selectedButton.classList.add('incorrect');
        correctButton.classList.add('correct');
        incorrectCount++;
        // Store incorrect question (both in regular mode and retest mode)
        incorrectQuestions.push(question);
    }
    
    // Update the combined progress and score display with colored incorrect count
    const totalQuestions = quizData[currentChapter].questions.length;
    const questionProgress = document.getElementById('question-progress');
    questionProgress.innerHTML = `Question ${currentQuestionIndex + 1} of ${totalQuestions}   |   <span class="incorrect-count">Incorrect: ${incorrectCount}</span>`;

    const noteElement = document.createElement('div');
    noteElement.id = 'question-note';
    noteElement.className = 'note';
    noteElement.textContent = question.note;
    optionsContainer.after(noteElement);

    if (currentQuestionIndex === quizData[currentChapter].questions.length - 1) {
        finishBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
    }
}

// Event Listeners
nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    showQuestion();
});

finishBtn.addEventListener('click', () => {
    quizSection.classList.add('hidden');
    resultSection.classList.remove('hidden');
    finalScore.textContent = `Correct: ${correctCount}, Incorrect: ${incorrectCount}`;
    
    // Show retest button if there are any incorrect answers
    if (incorrectCount > 0) {
        retestBtn.classList.remove('hidden');
    } else {
        retestBtn.classList.add('hidden');
    }
    
    // Clean up retest data if we're finishing a retest
    if (isRetestMode) {
        delete quizData['retest'];
    }
});

restartBtn.addEventListener('click', () => {
    resultSection.classList.add('hidden');
    chapterSelection.classList.remove('hidden');
    chaptersList.innerHTML = '';
    menuChaptersList.innerHTML = '';
    
    // Clean up retest data
    if (isRetestMode) {
        delete quizData['retest'];
    }
    
    isRetestMode = false;
    incorrectQuestions = [];
    initializeChapters();
});

// Add event listeners for navigation
/*
prevQuestionBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
});

nextQuestionBtn.addEventListener('click', () => {
    if (currentQuestionIndex < quizData[currentChapter].questions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    }
});
*/

// Add menu event listeners
menuBtn.addEventListener('click', () => {
    sideMenu.classList.add('active');
    menuOverlay.classList.add('active');
});

closeMenu.addEventListener('click', () => {
    sideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
});

menuOverlay.addEventListener('click', () => {
    sideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
});

// Update startRetest function
function startRetest() {
    isRetestMode = true;
    currentQuestionIndex = 0;
    correctCount = 0;
    incorrectCount = 0;
    
    // Create a deep copy of the most recent incorrect questions
    const retestQuestions = {
        questions: incorrectQuestions.map(q => ({...q})),
        title: 'Retest Incorrect Ones'
    };
    
    // Clear the incorrect questions array for the next round
    incorrectQuestions = [];
    
    // Reset display
    resultSection.classList.add('hidden');
    quizSection.classList.remove('hidden');
    document.getElementById('chapter-title').textContent = 'Retest Incorrect Ones';
    scoreDisplay.textContent = `Incorrect: ${incorrectCount}`;
    
    // Store retest questions in quizData
    currentChapter = 'retest';
    quizData[currentChapter] = retestQuestions;
    
    showQuestion();
}

// Add event listener for retest button
retestBtn.addEventListener('click', startRetest);

// Modify the initialization
// Replace the existing initializeChapters() call with:
fetchQuizData(); 
