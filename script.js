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

// Add this structure to track incorrect questions with context
let incorrectQuestionsWithContext = [];

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
const browseChaptersBtn = document.getElementById('browse-chapters');
const landingPage = document.getElementById('landing-page');
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
        console.log('Number of values:', values.length);
        console.log('Expected columns:', headers.length);

        try {
            // Validate that we have all required fields
            if (!values[0]) throw new Error('Missing chapter number');
            if (!values[3]) throw new Error('Missing question text');
            if (!values[4]) throw new Error('Missing options');
            if (!values[5]) throw new Error('Missing correct answer');

            // Parse options string into array of objects
            const optionsString = values[4]; // Options is in column 5
            console.log('Options string:', optionsString);
            
            const optionsArray = optionsString.split(',').map(opt => {
                const [letter, text] = opt.split(':');
                if (!letter || !text) {
                    throw new Error(`Invalid option format: ${opt}`);
                }
                return {
                    letter: letter.trim(),
                    text: text.trim()
                };
            });

            const question = {
                chapter: values[0], // Chapter number
                section: values[1] || null, // Sub-section number (e.g., 6.1)
                subSection: values[2] || null, // Sub-section name (only if there is a subsection)
                question: values[3], // Question text
                options: optionsArray, // Options array
                correct: values[5], // Correct answer
                note: values[6] || '', // Explanation note (optional)
                page: values[7] || '', // Page number (optional)
                difficulty: values[8] || '' // Difficulty level (optional)
            };
            console.log('Created question object:', question);
            questions.push(question);
        } catch (e) {
            console.error('Error parsing row:', e.message);
            console.error('Row values:', values);
            console.error('Row data:', row);
            continue; // Skip this row and continue with the next one
        }
    }

    console.log('\nFinal questions array:', questions);
    if (questions.length === 0) {
        throw new Error('No valid questions were parsed from the CSV file');
    }
    return questions;
}

function organizeQuestionsByChapter(questions) {
    console.log('\nStarting to organize questions by chapter');
    console.log('Input questions:', questions);
    
    quizData = questions.reduce((acc, question) => {
        const chapterNum = question.chapter;
        const section = question.section;
        console.log(`Processing chapter ${chapterNum}, section ${section}`);
        
        if (!acc[chapterNum]) {
            const title = getChapterTitle(chapterNum);
            console.log(`Creating new chapter with title: ${title}`);
            acc[chapterNum] = {
                title: title,
                sections: {},
                questions: [] // For questions without sections
            };
        }

        // Only create sections if there's an actual section number and subsection name
        if (section && section.trim() && question.subSection) {
            if (!acc[chapterNum].sections[section]) {
                acc[chapterNum].sections[section] = {
                    title: question.subSection,
                    questions: []
                };
            }
            acc[chapterNum].sections[section].questions.push(question);
        } else {
            // If no valid section or subsection, add to main chapter questions
            acc[chapterNum].questions.push(question);
        }
        
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
        default: return `${chapterNum}`;
    }
}

// Modify initializeChapters function
function initializeChapters() {
    Object.keys(quizData).forEach(chapter => {
        const chapterData = quizData[chapter];
        const hasSubsections = Object.keys(chapterData.sections).length > 0;
        
        // Create container for chapter and its sections
        const chapterContainer = document.createElement('div');
        chapterContainer.className = 'chapter-container';

        // Create button for main chapter list
        const chapterBtn = document.createElement('button');
        chapterBtn.className = 'chapter-btn';
        chapterBtn.textContent = `${chapter}: ${chapterData.title}`;
        
        if (hasSubsections) {
            // Make chapter collapsible only if it has subsections
            chapterBtn.classList.add('has-sections');
            chapterBtn.addEventListener('click', () => {
                // Close all other sections first
                const allChapterBtns = document.querySelectorAll('.chapter-btn.has-sections');
                const allSectionContainers = document.querySelectorAll('.sections-container');
                allChapterBtns.forEach(btn => {
                    if (btn !== chapterBtn) {
                        btn.classList.remove('active');
                    }
                });
                allSectionContainers.forEach(container => {
                    if (container !== chapterContainer.querySelector('.sections-container')) {
                        container.classList.remove('active');
                    }
                });

                // Toggle current section
                const sectionsContainer = chapterContainer.querySelector('.sections-container');
                const isActive = sectionsContainer.classList.contains('active');
                sectionsContainer.classList.toggle('active');
                chapterBtn.classList.toggle('active');
            });
            
            // Create and add sections container
            const sectionsContainer = document.createElement('div');
            sectionsContainer.className = 'sections-container';
            
            // Add subsections
            Object.keys(chapterData.sections).sort().forEach(section => {
                const sectionData = chapterData.sections[section];
                const sectionBtn = document.createElement('button');
                sectionBtn.className = 'section-btn';
                sectionBtn.textContent = `${section}: ${sectionData.title}`;
                sectionBtn.addEventListener('click', () => startSection(chapter, section));
                sectionsContainer.appendChild(sectionBtn);
            });
            
            chapterContainer.appendChild(chapterBtn);
            chapterContainer.appendChild(sectionsContainer);
        } else {
            // For chapters without subsections, make the chapter button directly start the quiz
            chapterBtn.addEventListener('click', () => startChapter(chapter));
            chapterContainer.appendChild(chapterBtn);
        }
        
        chaptersList.appendChild(chapterContainer);

        // Create similar structure for side menu
        const menuChapterContainer = document.createElement('div');
        menuChapterContainer.className = 'menu-chapter-container';

        const menuChapterBtn = document.createElement('button');
        menuChapterBtn.className = 'menu-chapter-btn';
        menuChapterBtn.textContent = `${chapter}: ${chapterData.title}`;
        
        if (hasSubsections) {
            // Make menu chapter collapsible only if it has subsections
            menuChapterBtn.classList.add('has-sections');
            menuChapterBtn.addEventListener('click', () => {
                // Close all other sections first in the side menu
                const allMenuChapterBtns = document.querySelectorAll('.menu-chapter-btn.has-sections');
                const allMenuSectionContainers = document.querySelectorAll('.menu-sections-container');
                allMenuChapterBtns.forEach(btn => {
                    if (btn !== menuChapterBtn) {
                        btn.classList.remove('active');
                    }
                });
                allMenuSectionContainers.forEach(container => {
                    if (container !== menuChapterContainer.querySelector('.menu-sections-container')) {
                        container.classList.remove('active');
                    }
                });

                // Toggle current section
                const sectionsContainer = menuChapterContainer.querySelector('.menu-sections-container');
                const isActive = sectionsContainer.classList.contains('active');
                sectionsContainer.classList.toggle('active');
                menuChapterBtn.classList.toggle('active');
            });
            
            const menuSectionsContainer = document.createElement('div');
            menuSectionsContainer.className = 'menu-sections-container';
            
            // Add subsections to menu
            Object.keys(chapterData.sections).sort().forEach(section => {
                const sectionData = chapterData.sections[section];
                const sectionBtn = document.createElement('button');
                sectionBtn.className = 'menu-section-btn';
                sectionBtn.textContent = `${section}: ${sectionData.title}`;
                sectionBtn.addEventListener('click', () => {
                    startSection(chapter, section);
                    sideMenu.classList.remove('active');
                    menuOverlay.classList.remove('active');
                });
                menuSectionsContainer.appendChild(sectionBtn);
            });
            
            menuChapterContainer.appendChild(menuChapterBtn);
            menuChapterContainer.appendChild(menuSectionsContainer);
        } else {
            // For chapters without subsections, make the menu chapter button directly start the quiz
            menuChapterBtn.addEventListener('click', () => {
                startChapter(chapter);
                sideMenu.classList.remove('active');
                menuOverlay.classList.remove('active');
            });
            menuChapterContainer.appendChild(menuChapterBtn);
        }
        
        menuChaptersList.appendChild(menuChapterContainer);
    });
}

// Add new function to start a section
function startSection(chapter, section) {
    currentChapter = chapter;
    currentSection = section;
    currentQuestionIndex = 0;
    correctCount = 0;
    incorrectCount = 0;
    // Clear incorrect questions when starting a new section
    incorrectQuestionsWithContext = [];
    isRetestMode = false;
    
    landingPage.classList.add('hidden');
    chapterSelection.classList.add('hidden');
    resultSection.classList.add('hidden');
    quizSection.classList.remove('hidden');
    
    const chapterData = quizData[chapter];
    const sectionData = chapterData.sections[section];
    
    // Only show section title if it exists
    if (sectionData && sectionData.title) {
        document.getElementById('chapter-title').textContent = `Section ${section}: ${chapterData.title} - ${sectionData.title}`;
    } else {
        document.getElementById('chapter-title').textContent = `Section ${chapter}: ${chapterData.title}`;
    }
    
    // Store current section questions
    currentSectionQuestions = sectionData ? sectionData.questions : chapterData.questions;
    showQuestion();
}

// Modify showQuestion function to use currentSectionQuestions when available
let currentSectionQuestions = null;

function showQuestion() {
    questionAnswered = false;
    const questions = currentSectionQuestions || quizData[currentChapter].questions;
    const question = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    
    const questionProgress = document.getElementById('question-progress');
    questionProgress.innerHTML = `Question ${currentQuestionIndex + 1} of ${totalQuestions}   |   <span class="incorrect-count">Incorrect: ${incorrectCount}</span>`;
    
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

    nextBtn.classList.add('hidden');
    finishBtn.classList.add('hidden');
}

// Update checkAnswer function
function checkAnswer(selectedLetter) {
    if (questionAnswered) return;
    
    questionAnswered = true;
    const questions = currentSectionQuestions || quizData[currentChapter].questions;
    const question = questions[currentQuestionIndex];
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
        
        // If in retest mode and answered correctly, remove from incorrect questions
        if (isRetestMode) {
            const index = incorrectQuestionsWithContext.findIndex(q => q.question === question.question);
            if (index !== -1) {
                incorrectQuestionsWithContext.splice(index, 1);
            }
        }
    } else {
        selectedButton.classList.add('incorrect');
        correctButton.classList.add('correct');
        incorrectCount++;
        
        if (!isRetestMode) {
            // In regular mode, add to incorrect questions
            const questionWithContext = {
                ...question,
                chapterNum: currentChapter,
                sectionNum: currentSection,
                questionIndex: currentQuestionIndex,
                options: [...question.options],
                timestamp: Date.now()
            };
            
            // Check if this question is already in the incorrect questions array
            const existingIndex = incorrectQuestionsWithContext.findIndex(
                q => q.question === question.question
            );
            
            if (existingIndex !== -1) {
                // Update existing entry with most recent attempt
                incorrectQuestionsWithContext[existingIndex] = questionWithContext;
            } else {
                // Add new incorrect question
                incorrectQuestionsWithContext.push(questionWithContext);
            }
        }
        // Note: In retest mode, incorrect answers are already in incorrectQuestionsWithContext
        // so we don't need to add them again
    }
    
    // Update the combined progress and score display with colored incorrect count
    const totalQuestions = questions.length;
    const questionProgress = document.getElementById('question-progress');
    questionProgress.innerHTML = `Question ${currentQuestionIndex + 1} of ${totalQuestions}   |   <span class="incorrect-count">Incorrect: ${incorrectCount}</span>`;

    const noteElement = document.createElement('div');
    noteElement.id = 'question-note';
    noteElement.className = 'note';
    noteElement.textContent = question.note;
    optionsContainer.after(noteElement);

    if (currentQuestionIndex === totalQuestions - 1) {
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
    
    if (isRetestMode) {
        // If we're finishing a retest, only show retest button if there are still incorrect questions
        if (incorrectQuestionsWithContext.length > 0) {
            retestBtn.classList.remove('hidden');
        } else {
            retestBtn.classList.add('hidden');
        }
        // Clean up retest data
        delete quizData['retest'];
    } else {
        // Regular mode - show retest button if there are incorrect answers from this session
        if (incorrectCount > 0) {
            retestBtn.classList.remove('hidden');
        } else {
            retestBtn.classList.add('hidden');
        }
    }
});

restartBtn.addEventListener('click', () => {
    // Only open the side menu, don't reset anything
    sideMenu.classList.add('active');
    menuOverlay.classList.add('active');
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

// Update startRetest function
function startRetest() {
    if (incorrectQuestionsWithContext.length === 0) {
        alert('No questions to retest!');
        return;
    }

    isRetestMode = true;
    currentQuestionIndex = 0;
    correctCount = 0;
    incorrectCount = 0;
    
    // Create retest questions structure with proper deep copy
    const retestQuestions = {
        questions: incorrectQuestionsWithContext.map(q => ({
            ...q,
            options: [...q.options]
        })),
        title: 'Retest Wrong Answers'
    };
    
    // Reset display
    resultSection.classList.add('hidden');
    quizSection.classList.remove('hidden');
    document.getElementById('chapter-title').textContent = 'Retest Wrong Answers';
    scoreDisplay.textContent = `Correct: ${correctCount}, Incorrect: ${incorrectCount}`;
    
    // Store retest questions in quizData
    currentChapter = 'retest';
    quizData[currentChapter] = retestQuestions;
    currentSectionQuestions = retestQuestions.questions;
    
    showQuestion();
}

// Add event listener for retest button
retestBtn.addEventListener('click', startRetest);

// Add this function to handle chapter menu opening
function openChapterMenu() {
    console.log('Opening chapter menu'); // Debug log
    sideMenu.classList.add('active');
    menuOverlay.classList.add('active');
}

// Add FAQ functionality
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // Close other open items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            // Toggle current item
            item.classList.toggle('active');
        });
    });
}

// Update initializeUI function to include FAQ initialization
function initializeUI() {
    // Existing initialization code
    menuBtn.addEventListener('click', openChapterMenu);

    if (browseChaptersBtn) {
        console.log('Browse chapters button found');
        browseChaptersBtn.addEventListener('click', openChapterMenu);
    } else {
        console.error('Browse chapters button not found');
    }

    closeMenu.addEventListener('click', () => {
        sideMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
    });

    menuOverlay.addEventListener('click', () => {
        sideMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
    });

    // Initialize FAQ
    initializeFAQ();
}

// Update startChapter function
function startChapter(chapterNum) {
    // Only reset if we're actually changing chapters
    if (currentChapter !== chapterNum) {
        currentChapter = chapterNum;
        currentSection = null;
        currentQuestionIndex = 0;
        correctCount = 0;
        incorrectCount = 0;
        // Clear incorrect questions when changing chapters
        incorrectQuestionsWithContext = [];
        isRetestMode = false;
    }
    
    // Hide all sections first
    landingPage.classList.add('hidden');
    chapterSelection.classList.add('hidden');
    resultSection.classList.add('hidden');
    quizSection.classList.remove('hidden');
    
    // For chapters without sections, just show the chapter title
    const chapterData = quizData[chapterNum];
    document.getElementById('chapter-title').textContent = `Section ${chapterNum}: ${chapterData.title}`;
    
    // Close the menu
    sideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
    
    // Reset current section questions
    currentSectionQuestions = null;
    
    showQuestion();
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded'); // Debug log
    initializeUI();
    fetchQuizData();
}); 