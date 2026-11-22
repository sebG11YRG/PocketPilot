
/* PocketPilot - Dashboard */

const periodSelect = document.getElementById("time-period");

let incomeChart = null;
let spendingChart = null;

// Load transactions
function loadTransactions() {
    return JSON.parse(localStorage.getItem("transactions")) || [];
}

// Load savings goals
function loadGoals() {
    return JSON.parse(localStorage.getItem("pocketpilot_goals")) || [];
}

// Format money
function formatMoney(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    }).format(amount);
}

// Read a saved transaction date
function parseDate(dateString) {
    if (typeof dateString !== "string") {
        return null;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

    if (!match) {
        return null;
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
        return null;
    }

    return date;
}

// Determine whether a transaction belongs to a period
function isInPeriod(transaction, period) {
    if (period === "all") {
        return true;
    }

    const date = parseDate(transaction.date);

    if (!date) {
        return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (period === "weekly") {
        const start = new Date(today);
        const dayOfWeek = (today.getDay() + 6) % 7;

        start.setDate(today.getDate() - dayOfWeek);

        const end = new Date(start);
        end.setDate(start.getDate() + 7);

        return date >= start && date < end;
    }

    if (period === "monthly") {
        return (
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    }

    if (period === "yearly") {
        return date.getFullYear() === today.getFullYear();
    }

    return false;
}

// Calculate income and expenses
function calculateTotals(transactions) {
    let income = 0;
    let expenses = 0;

    transactions.forEach(function(transaction) {
        const amount = Number(transaction.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            return;
        }

        if (transaction.type === "income") {
            income += amount;
        }

        if (transaction.type === "expense") {
            expenses += amount;
        }
    });

    return {
        income: income,
        expenses: expenses
    };
}

// Update everything on the Dashboard
function updateDashboard() {
    const allTransactions = loadTransactions();
    const goals = loadGoals();

    const period = periodSelect.value;

    const filteredTransactions = allTransactions.filter(
        function(transaction) {
            return isInPeriod(transaction, period);
        }
    );

    // Balance always includes all transactions
    const allTotals = calculateTotals(allTransactions);

    const totalBalance =
        allTotals.income - allTotals.expenses;

    // Income and expenses use the selected period
    const periodTotals = calculateTotals(filteredTransactions);

    document.getElementById("total-balance").textContent =
        formatMoney(totalBalance);

    document.getElementById("total-income").textContent =
        formatMoney(periodTotals.income);

    document.getElementById("total-expenses").textContent =
        formatMoney(periodTotals.expenses);

    // Calculate spending categories
    const categories = {
        Food: 0,
        Transportation: 0,
        Shopping: 0,
        Bills: 0,
        Entertainment: 0,
        Other: 0
    };

    filteredTransactions.forEach(function(transaction) {
        if (transaction.type !== "expense") {
            return;
        }

        const amount = Number(transaction.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            return;
        }

        const category = transaction.category || "Other";

        if (Object.prototype.hasOwnProperty.call(categories, category)) {
            categories[category] += amount;
        } else {
            categories.Other += amount;
        }
    });

    updateCharts(
        periodTotals.income,
        periodTotals.expenses,
        categories
    );

    displayDashboardGoals(goals);
    displayRecentTransactions(filteredTransactions);
}

// Update the graphs
function updateCharts(income, expenses, categories) {
    if (typeof Chart === "undefined") {
        console.error("Chart.js could not be loaded.");
        return;
    }

    if (incomeChart) {
        incomeChart.destroy();
    }

    if (spendingChart) {
        spendingChart.destroy();
    }

    // Income vs. Expenses
    incomeChart = new Chart(
        document.getElementById("incomeExpenseChart"),
        {
            type: "bar",
            data: {
                labels: ["Income", "Expenses"],
                datasets: [{
                    data: [income, expenses],
                    backgroundColor: ["#28d59b", "#fb626b"],
                    borderRadius: 8,
                    maxBarThickness: 100
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: "#a4b2cf"
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: "#a4b2cf",
                            callback: function(value) {
                                return "$" + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: "#293855"
                        }
                    }
                }
            }
        }
    );

    // Spending Categories
    const categoryColors = {
        Food: "#3b82f6",
        Transportation: "#28d59b",
        Shopping: "#f59e0b",
        Bills: "#fb626b",
        Entertainment: "#a855f7",
        Other: "#94a3b8"
    };

    const activeCategories = Object.keys(categories).filter(
        function(category) {
            return categories[category] > 0;
        }
    );

    const hasExpenses = activeCategories.length > 0;

    spendingChart = new Chart(
        document.getElementById("spendingChart"),
        {
            type: "doughnut",
            data: {
                labels: hasExpenses
                    ? activeCategories
                    : ["No expenses"],
                datasets: [{
                    data: hasExpenses
                        ? activeCategories.map(function(category) {
                            return categories[category];
                        })
                        : [1],
                    backgroundColor: hasExpenses
                        ? activeCategories.map(function(category) {
                            return categoryColors[category];
                        })
                        : ["#293855"],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "55%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: "#a4b2cf",
                            boxWidth: 12,
                            padding: 12
                        }
                    },
                    tooltip: {
                        enabled: hasExpenses
                    }
                }
            }
        }
    );
}

// Display savings goals
function displayDashboardGoals(goals) {
    const container = document.getElementById("dashboard-goals");
    container.innerHTML = "";

    if (goals.length === 0) {
        container.textContent = "No savings goals created yet.";
        return;
    }

    goals.forEach(function(goal) {
        const saved = Number(goal.saved) || 0;
        const target = Number(goal.target) || 0;

        const percentage = target > 0
            ? Math.min((saved / target) * 100, 100)
            : 0;

        const card = document.createElement("div");
        card.className = "dashboard-goal";

        const name = document.createElement("h4");
        name.textContent = goal.name;

        const details = document.createElement("p");
        details.textContent =
            formatMoney(saved) + " / " + formatMoney(target);

        const progress = document.createElement("progress");
        progress.max = 100;
        progress.value = percentage;

        card.appendChild(name);
        card.appendChild(details);
        card.appendChild(progress);

        container.appendChild(card);
    });
}

// Display recent transactions
function displayRecentTransactions(transactions) {
    const container = document.getElementById("recent-transactions");
    container.innerHTML = "";

    if (transactions.length === 0) {
        container.textContent = "No transactions for this period.";
        return;
    }

    const recent = transactions.slice().reverse().slice(0, 5);

    recent.forEach(function(transaction) {
        const item = document.createElement("div");
        item.className = "recent-transaction";

        const name = document.createElement("span");
        name.textContent = transaction.description;

        const amount = document.createElement("span");
        const isIncome = transaction.type === "income";

        amount.textContent =
            (isIncome ? "+" : "-") +
            formatMoney(Number(transaction.amount));

        amount.className = isIncome ? "income" : "expense";

        item.appendChild(name);
        item.appendChild(amount);

        container.appendChild(item);
    });
}

// Update when the time period changes
periodSelect.addEventListener("change", updateDashboard);

// Load the dashboard
updateDashboard();
