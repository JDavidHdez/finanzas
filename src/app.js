// Configuración inicial
const incomeCategories = [
    "Salario", "Freelance", "Inversiones", "Bonos", "Ventas", "Otros Ingresos"
];

const expenseCategories = [
    "Alimentación", "Transporte", "Vivienda", "Entretenimiento", "Salud", 
    "Educación", "Compras", "Servicios", "Ropa", "Otros Gastos"
];

let transactions = [];
let monthlyChart = null;
let categoryChart = null;
let currentType = 'income';

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function() {
    loadTransactions();
    updateCategories();
    setTodayDate();
    updateSummary();
    renderTransactions();
    createCharts();
});

// Gestión de tipo de transacción
function selectTransactionType(type) {
    currentType = type;
    
    // Actualizar UI de radio buttons
    document.querySelectorAll('.radio-option').forEach(option => {
        option.classList.remove('active');
    });
    
    if (type === 'income') {
        document.querySelectorAll('.radio-option')[0].classList.add('active');
    } else {
        document.querySelectorAll('.radio-option')[1].classList.add('active');
    }
    
    updateCategories();
}

// Actualizar categorías según el tipo
function updateCategories() {
    const categorySelect = document.getElementById('category');
    const categories = currentType === 'income' ? incomeCategories : expenseCategories;
    
    categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// Establecer fecha actual
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// Cargar transacciones desde localStorage
function loadTransactions() {
    const stored = localStorage.getItem('financeTransactions');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            transactions = data.transactions || [];
        } catch (error) {
            console.error('Error loading transactions:', error);
            transactions = [];
        }
    }
}

// Guardar transacciones en localStorage
function saveTransactions() {
    const data = {
        transactions: transactions,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
    };
    localStorage.setItem('financeTransactions', JSON.stringify(data));
}

// Agregar nueva transacción
function addTransaction() {
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value.trim();
    const date = document.getElementById('date').value;

    // Validaciones
    if (!amount || amount <= 0) {
        alert('❌ Por favor ingresa una cantidad válida mayor a 0');
        return;
    }

    if (!category) {
        alert('❌ Por favor selecciona una categoría');
        return;
    }

    if (!description) {
        alert('❌ Por favor ingresa una descripción');
        return;
    }

    if (!date) {
        alert('❌ Por favor selecciona una fecha');
        return;
    }

    // Crear nueva transacción
    const transaction = {
        id: Date.now(),
        type: currentType,
        amount: amount,
        category: category,
        description: description,
        date: date,
        createdAt: new Date().toISOString()
    };

    transactions.push(transaction);
    saveTransactions();
    
    // Actualizar UI
    updateSummary();
    renderTransactions();
    createCharts();
    clearForm();

    // Mostrar confirmación
    showNotification(`✅ ${currentType === 'income' ? 'Ingreso' : 'Gasto'} agregado correctamente`);
}

// Limpiar formulario
function clearForm() {
    document.getElementById('amount').value = '';
    document.getElementById('category').value = '';
    document.getElementById('description').value = '';
    setTodayDate();
}

// Eliminar transacción
function deleteTransaction(id) {
    if (confirm('❓ ¿Estás seguro de que quieres eliminar esta transacción?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        updateSummary();
        renderTransactions();
        createCharts();
        showNotification('🗑️ Transacción eliminada');
    }
}

// Actualizar resumen financiero
function updateSummary() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    
    const balanceElement = document.getElementById('balance');
    balanceElement.textContent = formatCurrency(balance);
    balanceElement.className = `summary-value balance ${balance >= 0 ? 'positive' : 'negative'}`;
}

// Renderizar lista de transacciones
function renderTransactions() {
    const container = document.getElementById('transactionsList');
    const countElement = document.getElementById('transactionCount');
    
    countElement.textContent = `${transactions.length} transacciones`;

    if (transactions.length === 0) {
        container.innerHTML = '<div class="no-transactions">📝 No hay transacciones registradas</div>';
        return;
    }

    // Ordenar por fecha (más recientes primero)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sortedTransactions.map(transaction => `
        <div class="transaction-item fade-in">
            <div class="transaction-date">${formatDate(transaction.date)}</div>
            <div class="transaction-type ${transaction.type === 'income' ? 'type-income' : 'type-expense'}">
                ${transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
            </div>
            <div class="transaction-category">${transaction.category}</div>
            <div class="transaction-description">${transaction.description}</div>
            <div class="transaction-amount ${transaction.type === 'income' ? 'amount-income' : 'amount-expense'}">
                ${transaction.type === 'expense' ? '-' : '+'}${formatCurrency(transaction.amount)}
            </div>
            <button class="delete-btn" onclick="deleteTransaction(${transaction.id})" title="Eliminar">
                🗑️
            </button>
        </div>
    `).join('');
}

// Crear gráficas
function createCharts() {
    createMonthlyChart();
    createCategoryChart();
}

// Gráfica mensual
function createMonthlyChart() {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }

    const monthlyData = getMonthlyData();
    
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthlyData.labels,
            datasets: [
                {
                    label: 'Ingresos',
                    data: monthlyData.income,
                    backgroundColor: 'rgba(56, 161, 105, 0.7)',
                    borderColor: 'rgba(56, 161, 105, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                },
                {
                    label: 'Gastos',
                    data: monthlyData.expenses,
                    backgroundColor: 'rgba(229, 62, 62, 0.7)',
                    borderColor: 'rgba(229, 62, 62, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Ingresos vs Gastos por Mes',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Gráfica de categorías
function createCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    if (categoryChart) {
        categoryChart.destroy();
    }

    const categoryData = getCategoryData();
    
    if (categoryData.labels.length === 0) {
        // Mostrar mensaje cuando no hay datos
        ctx.font = '16px Arial';
        ctx.fillStyle = '#a0aec0';
        ctx.textAlign = 'center';
        ctx.fillText('No hay gastos para mostrar', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categoryData.labels,
            datasets: [{
                data: categoryData.data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                    '#4BC0C0', '#FF6384'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución de Gastos por Categoría',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

// Obtener datos mensuales
function getMonthlyData() {
    const monthlyStats = {};
    
    transactions.forEach(transaction => {
        const monthKey = transaction.date.substring(0, 7); // YYYY-MM
        
        if (!monthlyStats[monthKey]) {
            monthlyStats[monthKey] = { income: 0, expenses: 0 };
        }
        
        if (transaction.type === 'income') {
            monthlyStats[monthKey].income += transaction.amount;
        } else {
            monthlyStats[monthKey].expenses += transaction.amount;
        }
    });

    const sortedMonths = Object.keys(monthlyStats).sort();
    
    return {
        labels: sortedMonths.map(month => formatMonth(month)),
        income: sortedMonths.map(month => monthlyStats[month].income),
        expenses: sortedMonths.map(month => monthlyStats[month].expenses)
    };
}

// Obtener datos de categorías
function getCategoryData() {
    const categoryStats = {};
    
    transactions
        .filter(t => t.type === 'expense')
        .forEach(transaction => {
            if (!categoryStats[transaction.category]) {
                categoryStats[transaction.category] = 0;
            }
            categoryStats[transaction.category] += transaction.amount;
        });

    const sortedCategories = Object.entries(categoryStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8); // Top 8 categorías

    return {
        labels: sortedCategories.map(([category]) => category),
        data: sortedCategories.map(([, amount]) => amount)
    };
}

// Funciones de utilidad
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatMonth(monthString) {
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('es-ES', {
        month: 'short',
        year: 'numeric'
    });
}

function showNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4facfe;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;

    // Agregar animación CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    
    if (!document.head.querySelector('style[data-notifications]')) {
        style.setAttribute('data-notifications', 'true');
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Exportar datos como JSON
function exportData() {
    const data = {
        transactions: transactions,
        summary: {
            totalTransactions: transactions.length,
            totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
            totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
            exportDate: new Date().toISOString()
        }
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `finanzas_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Importar datos desde JSON
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (importedData.transactions && Array.isArray(importedData.transactions)) {
                if (confirm('❓ ¿Quieres reemplazar todos los datos actuales con los datos importados?')) {
                    transactions = importedData.transactions;
                    saveTransactions();
                    updateSummary();
                    renderTransactions();
                    createCharts();
                    showNotification('✅ Datos importados correctamente');
                }
            } else {
                alert('❌ El archivo no tiene el formato correcto');
            }
        } catch (error) {
            alert('❌ Error al leer el archivo: ' + error.message);
        }
    };
    
    reader.readAsText(file);
    // Limpiar el input
    event.target.value = '';
}

// Limpiar todos los datos
function clearAllData() {
    if (confirm('⚠️ ¿Estás seguro de que quieres eliminar TODAS las transacciones? Esta acción no se puede deshacer.')) {
        if (confirm('🚨 CONFIRMACIÓN FINAL: Se eliminarán todas las transacciones. ¿Continuar?')) {
            transactions = [];
            saveTransactions();
            updateSummary();
            renderTransactions();
            createCharts();
            showNotification('🗑️ Todos los datos han sido eliminados');
        }
    }
}

// Agregar botones de utilidades al header
function addUtilityButtons() {
    const header = document.querySelector('#datos');
    const utilityDiv = document.createElement('div');
    utilityDiv.style.cssText = `
        margin-top: 20px;
        display: flex;
        gap: 10px;
        justify-content: center;
        flex-wrap: wrap;
    `;
    
    utilityDiv.innerHTML = `
        <button onclick="exportData()" style="
            background: rgba(51, 51, 51,0.2);
            color: white;
            border: 1px solid rgba(51, 51, 51,0.3);
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        " onmouseover="this.style.background='rgba(51, 51, 51,0.3)'" 
            onmouseout="this.style.background='rgba(51, 51, 51,0.2)'">
            📥 Exportar Datos
        </button>
        <label for="importFile" style="
            background: rgba(51, 51, 51,0.2);
            color: white;
            border: 1px solid rgba(51, 51, 51,0.3);
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        " onmouseover="this.style.background='rgba(51, 51, 51,0.3)'" 
            onmouseout="this.style.background='rgba(51, 51, 51,0.2)'">
            📤 Importar Datos
        </label>
        <input type="file" id="importFile" accept=".json" onchange="importData(event)" style="display: none;">
        <button onclick="clearAllData()" style="
            background: rgba(229,62,62,0.2);
            color: white;
            border: 1px solid rgba(229,62,62,0.3);
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        " onmouseover="this.style.background='rgba(229,62,62,0.3)'" 
            onmouseout="this.style.background='rgba(229,62,62,0.2)'">
            🗑️ Limpiar Todo
        </button>
    `;
    
    header.appendChild(utilityDiv);
}

// Filtros avanzados
function addFilters() {
    const transactionsSection = document.querySelector('.transactions-section');
    const filtersDiv = document.createElement('div');
    filtersDiv.style.cssText = `
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
        padding: 15px;
        background: #f8fafc;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        flex-wrap: wrap;
        align-items: center;
    `;
    
    filtersDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <label style="font-weight: 500; color: #4a5568;">Filtrar por:</label>
        </div>
        <select id="filterType" onchange="applyFilters()" style="
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 14px;
        ">
            <option value="all">Todos</option>
            <option value="income">Solo Ingresos</option>
            <option value="expense">Solo Gastos</option>
        </select>
        <select id="filterCategory" onchange="applyFilters()" style="
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 14px;
        ">
            <option value="all">Todas las categorías</option>
        </select>
        <input type="month" id="filterMonth" onchange="applyFilters()" style="
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 14px;
        ">
        <button onclick="clearFilters()" style="
            background: #e2e8f0;
            color: #4a5568;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        ">
            🔄 Limpiar Filtros
        </button>
    `;
    
    transactionsSection.insertBefore(filtersDiv, transactionsSection.children[1]);
    updateFilterCategories();
}

function updateFilterCategories() {
    const filterCategory = document.getElementById('filterCategory');
    const allCategories = [...new Set(transactions.map(t => t.category))].sort();
    
    filterCategory.innerHTML = '<option value="all">Todas las categorías</option>';
    allCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filterCategory.appendChild(option);
    });
}

function applyFilters() {
    const typeFilter = document.getElementById('filterType').value;
    const categoryFilter = document.getElementById('filterCategory').value;
    const monthFilter = document.getElementById('filterMonth').value;
    
    let filteredTransactions = [...transactions];
    
    if (typeFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
    }
    
    if (categoryFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
    }
    
    if (monthFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.date.startsWith(monthFilter));
    }
    
    renderFilteredTransactions(filteredTransactions);
}

function renderFilteredTransactions(filteredTransactions) {
    const container = document.getElementById('transactionsList');
    const countElement = document.getElementById('transactionCount');
    
    countElement.textContent = `${filteredTransactions.length} de ${transactions.length} transacciones`;

    if (filteredTransactions.length === 0) {
        container.innerHTML = '<div class="no-transactions">🔍 No se encontraron transacciones con los filtros aplicados</div>';
        return;
    }

    const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sortedTransactions.map(transaction => `
        <div class="transaction-item fade-in">
            <div class="transaction-date">${formatDate(transaction.date)}</div>
            <div class="transaction-type ${transaction.type === 'income' ? 'type-income' : 'type-expense'}">
                ${transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
            </div>
            <div class="transaction-category">${transaction.category}</div>
            <div class="transaction-description">${transaction.description}</div>
            <div class="transaction-amount ${transaction.type === 'income' ? 'amount-income' : 'amount-expense'}">
                ${transaction.type === 'expense' ? '-' : '+'}${formatCurrency(transaction.amount)}
            </div>
            <button class="delete-btn" onclick="deleteTransaction(${transaction.id})" title="Eliminar">
                🗑️
            </button>
        </div>
    `).join('');
}

function clearFilters() {
    document.getElementById('filterType').value = 'all';
    document.getElementById('filterCategory').value = 'all';
    document.getElementById('filterMonth').value = '';
    renderTransactions();
}

// Búsqueda
function addSearchFunction() {
    const transactionsSection = document.querySelector('.transactions-section');
    const searchDiv = document.createElement('div');
    searchDiv.style.cssText = `
        margin-bottom: 15px;
        position: relative;
    `;
    
    searchDiv.innerHTML = `
        <input type="text" id="searchInput" placeholder="🔍 Buscar en descripción..." 
                oninput="searchTransactions()" style="
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        " onfocus="this.style.borderColor='#4facfe'" 
            onblur="this.style.borderColor='#e2e8f0'">
    `;
    
    transactionsSection.insertBefore(searchDiv, transactionsSection.children[1]);
}

function searchTransactions() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (searchTerm === '') {
        renderTransactions();
        return;
    }
    
    const filteredTransactions = transactions.filter(transaction => 
        transaction.description.toLowerCase().includes(searchTerm) ||
        transaction.category.toLowerCase().includes(searchTerm)
    );
    
    renderFilteredTransactions(filteredTransactions);
}

// Inicializar funciones adicionales cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        addUtilityButtons();
        addSearchFunction();
        addFilters();
    }, 100);
});

// Atajos de teclado
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter para agregar transacción
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        addTransaction();
    }
    
    // Escape para limpiar formulario
    if (e.key === 'Escape') {
        clearForm();
        document.getElementById('searchInput').value = '';
        clearFilters();
    }
});

// Auto-save cada 30 segundos (backup de seguridad)
setInterval(() => {
    if (transactions.length > 0) {
        saveTransactions();
    }
}, 30000);