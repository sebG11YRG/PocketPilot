
/* PocketPilot - Savings Goals */

// Load saved goals
let goals = JSON.parse(localStorage.getItem("pocketpilot_goals")) || [];

const goalForm = document.getElementById("goal-form");
const goalsList = document.getElementById("goals-list");
const goalsEmpty = document.getElementById("goals-empty");

// Format currency
function formatMoney(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    }).format(amount);
}

// Save goals
function saveGoals() {
    localStorage.setItem("pocketpilot_goals", JSON.stringify(goals));
}

// Display all savings goals
function displayGoals() {
    goalsList.innerHTML = "";

    if (goals.length === 0) {
        goalsEmpty.style.display = "block";
        return;
    }

    goalsEmpty.style.display = "none";

    goals.forEach(function(goal) {
        const saved = Number(goal.saved) || 0;
        const target = Number(goal.target) || 0;

        const remaining = Math.max(target - saved, 0);

        const percentage = target > 0
            ? Math.min((saved / target) * 100, 100)
            : 0;

        const card = document.createElement("div");
        card.className = "goal-card";

        // Goal name
        const title = document.createElement("h4");
        title.textContent = goal.name;

        // Amount saved
        const savedText = document.createElement("p");
        savedText.className = "goal-amount";
        savedText.textContent =
            "Saved: " + formatMoney(saved);

        // Target amount
        const targetText = document.createElement("p");
        targetText.className = "goal-amount";
        targetText.textContent =
            "Target: " + formatMoney(target);

        // Remaining amount
        const remainingText = document.createElement("p");
        remainingText.className = "goal-amount";
        remainingText.textContent =
            "Remaining: " + formatMoney(remaining);

        // Progress bar
        const progressBar = document.createElement("progress");
        progressBar.max = 100;
        progressBar.value = percentage;

        // Percentage completed
        const percentageText = document.createElement("p");
        percentageText.className = "goal-percentage";
        percentageText.textContent =
            percentage.toFixed(0) + "% completed";

        // Add Savings button
        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.className = "goal-button";
        addButton.textContent = "Add Savings";

        if (remaining === 0) {
            addButton.disabled = true;
            addButton.textContent = "Goal Completed";
        }

        addButton.addEventListener("click", function() {
            const input = prompt(
                "How much would you like to add? " +
                "Remaining: " + formatMoney(remaining)
            );

            if (input === null) {
                return;
            }

            const amount = Number(input);

            if (!input.trim() || !Number.isFinite(amount) || amount <= 0) {
                alert("Please enter a valid amount.");
                return;
            }

            // Prevent contributing more than needed
            const amountInCents = Math.round(amount * 100);
            const remainingInCents = Math.round(remaining * 100);

            if (amountInCents > remainingInCents) {
                alert(
                    "You can only add up to " +
                    formatMoney(remaining) +
                    " to this goal."
                );
                return;
            }

            goal.saved = Math.round(
                (saved * 100 + amountInCents)
            ) / 100;

            saveGoals();
            displayGoals();
        });

        // Delete Goal button
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete Goal";

        deleteButton.addEventListener("click", function() {
            const confirmed = confirm(
                "Are you sure you want to delete " +
                goal.name + "?"
            );

            if (!confirmed) {
                return;
            }

            goals = goals.filter(function(item) {
                return item !== goal;
            });

            saveGoals();
            displayGoals();
        });

        // Add elements to the goal card
        card.appendChild(title);
        card.appendChild(savedText);
        card.appendChild(targetText);
        card.appendChild(remainingText);
        card.appendChild(progressBar);
        card.appendChild(percentageText);
        card.appendChild(addButton);
        card.appendChild(deleteButton);

        goalsList.appendChild(card);
    });
}

// Create a savings goal
goalForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("goal-name").value.trim();
    const target = Number(document.getElementById("goal-amount").value);

    if (
        !name ||
        !Number.isFinite(target) ||
        target <= 0 ||
        Math.round(target * 100) / 100 <= 0
    ) {
        alert("Please enter a valid goal name and target amount.");
        return;
    }

    const goal = {
        id: Date.now(),
        name: name,
        target: Math.round(target * 100) / 100,
        saved: 0
    };

    goals.push(goal);

    saveGoals();
    displayGoals();
    goalForm.reset();
});

// Load saved goals
displayGoals();
