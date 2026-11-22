
/* PocketPilot - Transaction Manager */

// Load saved transactions
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

const form = document.getElementById("transaction-form");
const transactionList = document.getElementById("transaction-list");
const emptyMessage = document.getElementById("empty-message");
const clearButton = document.getElementById("clear-all-button");
const dateInput = document.getElementById("transaction-date");

// Get today's date
function getToday() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}

function setDefaultDate() {
    dateInput.value = getToday();
}

// Save transactions
function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Format money
function formatMoney(amount) {
    return "$" + Number(amount).toFixed(2);
}

// Format transaction dates
function formatDate(dateString) {
    if (typeof dateString !== "string") {
        return "Date not recorded";
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

    if (!match) {
        return "Date not recorded";
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return "Date not recorded";
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

// Display transaction history
function displayTransactions() {
    transactionList.innerHTML = "";

    if (transactions.length === 0) {
        emptyMessage.style.display = "block";
        return;
    }

    emptyMessage.style.display = "none";

    // Show newest transactions first
    transactions.slice().reverse().forEach(function(transaction) {
        const item = document.createElement("li");
        item.className = "transaction-item";

        const information = document.createElement("div");

        const name = document.createElement("div");
        name.textContent = transaction.description;
        name.style.fontWeight = "bold";

        const details = document.createElement("div");
        details.style.color = "#a4b2cf";
        details.style.fontSize = "13px";
        details.style.marginTop = "5px";

        const category = transaction.category ||
            (transaction.type === "income" ? "Income" : "Other");

        details.textContent =
            category + " • " + formatDate(transaction.date);

        information.appendChild(name);
        information.appendChild(details);

        const actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.alignItems = "center";
        actions.style.gap = "16px";

        const amount = document.createElement("span");
        const isIncome = transaction.type === "income";

        amount.textContent =
            (isIncome ? "+" : "-") +
            formatMoney(transaction.amount);

        amount.className = isIncome ? "income" : "expense";

        // Delete individual transaction
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.type = "button";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", function() {
            const confirmed = confirm(
                "Delete this transaction: " +
                transaction.description + "?"
            );

            if (!confirmed) {
                return;
            }

            // Remove only this transaction
            const index = transactions.indexOf(transaction);

            if (index !== -1) {
                transactions.splice(index, 1);
            }

            saveTransactions();
            displayTransactions();
        });

        actions.appendChild(amount);
        actions.appendChild(deleteButton);

        item.style.display = "flex";
        item.style.justifyContent = "space-between";
        item.style.alignItems = "center";
        item.style.gap = "16px";
        item.style.flexWrap = "wrap";

        item.appendChild(information);
        item.appendChild(actions);

        transactionList.appendChild(item);
    });
}

// Add new transaction
form.addEventListener("submit", function(event) {
    event.preventDefault();

    const description =
        document.getElementById("description").value.trim();

    const amount =
        Number(document.getElementById("amount").value);

    const type =
        document.getElementById("type").value;

    const category =
        document.getElementById("category").value;

    const date = dateInput.value;

    if (!description || !Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid description and amount.");
        return;
    }

    if (!date) {
        alert("Please select a transaction date.");
        return;
    }

    const transaction = {
        id: Date.now(),
        description: description,
        amount: amount,
        type: type,
        category: type === "income" ? "Income" : category,
        date: date
    };

    transactions.push(transaction);

    saveTransactions();
    displayTransactions();

    form.reset();
    setDefaultDate();
});

// Clear all PocketPilot data
clearButton.addEventListener("click", function() {
    const confirmed = confirm(
        "Are you sure you want to delete ALL transactions " +
        "and savings goals? This cannot be undone."
    );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem("transactions");
    localStorage.removeItem("pocketpilot_goals");

    transactions = [];

    displayTransactions();
    form.reset();
    setDefaultDate();

    alert("All PocketPilot data has been cleared.");
});

// Load the page
setDefaultDate();
displayTransactions();
