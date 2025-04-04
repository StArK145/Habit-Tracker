

// Initialize habits from localStorage
const habits = JSON.parse(localStorage.getItem("habits")) || [];
const introSeen = localStorage.getItem("introSeen") === "true";
let lastCheckedDate = localStorage.getItem("lastCheckedDate") || new Date().toDateString();

// Check for dark mode preference in localStorage
const prefersDarkMode = localStorage.getItem("darkMode") === "true";

// Apply dark mode immediately if it was previously selected
if (prefersDarkMode) {
    document.body.classList.add("dark-mode");
    document.getElementById("darkModeBtn").textContent = "☀️";
}

// Hide intro card if user has seen it before
if (introSeen) {
    document.getElementById("introCard").style.display = "none";
}

// Save habits to localStorage
function saveHabits() {
    localStorage.setItem("habits", JSON.stringify(habits));
}

// Get current day of the week (0: Monday, 6: Sunday)
function getCurrentDayIndex() {
    const date = new Date();
    let day = date.getDay(); // Sunday is 0, Monday is 1, etc.
    return day === 0 ? 6 : day - 1; // Convert to Monday:0, Sunday:6
}

// Check if we need to mark missed days
function checkForMissedDays() {
    const currentDate = new Date().toDateString();
    const currentDayIndex = getCurrentDayIndex();
    
    // If it's a new day
    if (currentDate !== lastCheckedDate) {
        // Get yesterday's index
        let yesterdayIndex = currentDayIndex - 1;
        if (yesterdayIndex < 0) yesterdayIndex = 6; // Wrap around to Sunday
        
        // Check all habits and mark yesterday as missed if not completed
        habits.forEach(habit => {
            if (!habit.days[yesterdayIndex] && !habit.missedDays) {
                habit.missedDays = {};
            }
            
            if (!habit.days[yesterdayIndex]) {
                habit.missedDays[yesterdayIndex] = true;
                // Reset streak if a day was missed
                habit.streak = 0;
            }
        });
        
        // Update last checked date
        lastCheckedDate = currentDate;
        localStorage.setItem("lastCheckedDate", lastCheckedDate);
        saveHabits();
    }
}

// Add a new habit
function addHabit() {
    const habitName = document.getElementById("habitInput").value.trim();
    if (!habitName) {
        alert("Please enter a habit name");
        return;
    }
    habits.push({ 
        name: habitName, 
        days: Array(7).fill(false), 
        streak: 0,
        streakDays: 0,
        missedDays: {},
        createdAt: new Date().toISOString(),
        lastReset: new Date().toISOString()
    });
    saveHabits();
    renderHabits();
    document.getElementById("habitInput").value = "";
}

// Toggle completion status for a day
function toggleDay(habitIndex, dayIndex) {
    // Check if it's the current day (only allow clicking on current day)
    if (dayIndex === getCurrentDayIndex()) {
        let habit = habits[habitIndex];
        habit.days[dayIndex] = !habit.days[dayIndex];
        
        // If completed, update streak days
        if (habit.days[dayIndex]) {
            habit.streakDays = (habit.streakDays || 0) + 1;
            
            // If streak days reaches 7, increase streak and reset streak days
            if (habit.streakDays >= 7) {
                habit.streak += 1;
                habit.streakDays = 0;
            }
        } else {
            // If uncompleted, decrease streak days
            habit.streakDays = Math.max(0, (habit.streakDays || 0) - 1);
        }
        
        // Check if all days are complete for this habit
        checkWeekCompletion(habitIndex);
        
        saveHabits();
        renderHabits();
        
        // Provide visual feedback
        if (habit.days[dayIndex]) {
            showCompletionFeedback();
        }
    }
}

// Check if all days in the week are complete for a habit
function checkWeekCompletion(habitIndex) {
    const habit = habits[habitIndex];
    const allDaysComplete = habit.days.every(day => day);
    
    if (allDaysComplete) {
        // Auto-reset for the next week
        habit.days.fill(false);
        habit.missedDays = {};
        habit.lastReset = new Date().toISOString();
        
        // Allow the current day to be immediately marked again
        const currentDay = getCurrentDayIndex();
        habit.days[currentDay] = false;
        
        alert(`Great job completing all days for "${habit.name}"! Your week has been reset.`);
    }
}

// Delete a habit
function deleteHabit(index) {
    if (confirm("Are you sure you want to delete this habit?")) {
        habits.splice(index, 1);
        saveHabits();
        renderHabits();
    }
}

// Export habits data as JSON
function exportData() {
    const dataStr = JSON.stringify(habits, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'habits-data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    const isDarkMode = document.body.classList.contains("dark-mode");
    
    // Save preference to localStorage
    localStorage.setItem("darkMode", isDarkMode);
    
    // Update button icon
    document.getElementById("darkModeBtn").textContent = isDarkMode ? "☀️" : "🌙";
}

// Close intro card
function closeIntro() {
    document.getElementById("introCard").style.display = "none";
    localStorage.setItem("introSeen", "true");
}

// Toggle intro card visibility
function toggleIntroCard() {
    const introCard = document.getElementById("introCard");
    introCard.style.display = introCard.style.display === "none" ? "block" : "none";
}

// Show visual feedback for habit completion
function showCompletionFeedback() {
    // Simple feedback animation could be added here
}

// Render all habits
function renderHabits() {
    const habitList = document.getElementById("habitList");
    const noHabitsMsg = document.getElementById("noHabits");
    const currentDayIndex = getCurrentDayIndex();
    
    // Check for missed days before rendering
    checkForMissedDays();
    
    habitList.innerHTML = "";
    
    if (habits.length === 0) {
        noHabitsMsg.style.display = "block";
        return;
    } else {
        noHabitsMsg.style.display = "none";
    }

    habits.forEach((habit, habitIndex) => {
        const completedDays = habit.days.filter(done => done).length;
        const progressPercentage = (completedDays / 7) * 100;
        
        const li = document.createElement("li");
        li.className = "habit";
        
        let daysHTML = '';
        for (let i = 0; i < 7; i++) {
            // Determine if this day is clickable (only the current day)
            const isActive = i === currentDayIndex;
            const activeClass = isActive ? 'active' : 'inactive';
            const onClickEvent = isActive ? `onclick="toggleDay(${habitIndex}, ${i})"` : '';
            
            // Check if this day was missed
            const isMissed = habit.missedDays && habit.missedDays[i];
            const missedClass = isMissed ? 'missed' : '';
            
            daysHTML += `
                <div class="day ${habit.days[i] ? 'completed' : ''} ${activeClass} ${missedClass}" 
                     ${onClickEvent} 
                     title="${dayNames[i]}${isActive ? ' (Today)' : ''}${isMissed ? ' (Missed)' : ''}">
                    ${habit.days[i] ? '✓' : (isMissed ? '✗' : '')}
                    <span class="day-label">${dayNames[i]}</span>
                </div>
            `;
        }
        
        // Calculate streak display
        const streakDisplay = habit.streak > 0 
            ? `${habit.streak} ${habit.streak === 1 ? 'week' : 'weeks'}`
            : '0';
        
        li.innerHTML = `
            <div class="habit-name">
                ${habit.name}
                <span class="streak" title="Current streak">🔥 ${streakDisplay}</span>
            </div>
            
            <div class="days">
                ${daysHTML}
            </div>
            
            <div class="habit-info">
                <div class="progress-container">
                    <span class="progress-label">${completedDays}/7</span>
                    <div class="progress">
                        <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>
                <button class="delete-btn" onclick="deleteHabit(${habitIndex})" title="Delete habit">🗑️</button>
            </div>
        `;
        habitList.appendChild(li);
    });
}

// Day names for labels
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Initialize the app
renderHabits();