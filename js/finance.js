// Finance Management Functionality

class FinanceManager {
    constructor() {
        this.budgets = {};
    }

    addBudget(category, amount) {
        if (!this.budgets[category]) {
            this.budgets[category] = 0;
        }
        this.budgets[category] += amount;
    }

    getBudget(category) {
        return this.budgets[category] || 0;
    }

    totalBudget() {
        return Object.values(this.budgets).reduce((total, amount) => total + amount, 0);
    }
}

// Example usage:
const financeManager = new FinanceManager();
financeManager.addBudget('Marketing', 500);
financeManager.addBudget('Development', 2000);
console.log(financeManager.getBudget('Marketing')); // 500
console.log(financeManager.totalBudget()); // 2500
