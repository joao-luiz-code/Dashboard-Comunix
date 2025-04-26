// Configurações
const config = {
    jsonPath: './data/backups.json',
    refreshInterval: 300000 // 5 minutos
};

// Elementos DOM
const elements = {
    chart: document.getElementById('backupChart'),
    chartLoading: document.getElementById('chartLoading'),
    tableBody: document.getElementById('backupTableBody'),
    tableLoading: document.getElementById('tableLoading'),
    tableContainer: document.getElementById('backupTableContainer'),
    errorAlert: document.getElementById('errorAlert'),
    lastUpdate: document.getElementById('lastUpdate'),
    refreshBtn: document.getElementById('refreshBtn')
};

// Variáveis globais
let backupData = null;
let chartInstance = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    elements.refreshBtn.addEventListener('click', loadData);
    setInterval(loadData, config.refreshInterval);
});

// Carrega dados do JSON
async function loadData() {
    try {
        showLoading();
        
        const response = await fetch(config.jsonPath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        backupData = await response.json();
        renderData();
        
    } catch (error) {
        showError(`Falha ao carregar dados: ${error.message}`);
        console.error("Erro:", error);
    }
}

// Renderiza os dados
function renderData() {
    if (!backupData) return;
    
    renderChart();
    renderTable();
    updateTimestamp();
}

// Atualiza gráfico
function renderChart() {
    // Destrói gráfico anterior se existir
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // Calcula totais
    const totalOk = backupData.resumo_geral.total_arquivos_ok;
    const totalFail = backupData.resumo_geral.total_arquivos_nao_ok;
    const totalPending = backupData.resumo_geral.diretorios_sem_backup;
    
    // Cria novo gráfico
    const ctx = elements.chart.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Concluídos', 'Falhas', 'Pendentes'],
            datasets: [{
                data: [totalOk, totalFail, totalPending],
                backgroundColor: [
                    '#28a745',
                    '#dc3545',
                    '#ffc107'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ${context.raw} backups`;
                        }
                    }
                }
            }
        }
    });
    
    elements.chartLoading.classList.add('d-none');
    elements.chart.classList.remove('d-none');
}

// Atualiza tabela
function renderTable() {
    let tableHTML = '';
    
    backupData.diretorios.forEach(diretorio => {
        diretorio.arquivos.forEach(arquivo => {
            tableHTML += `
                <tr>
                    <td>${backupData.cliente}</td>
                    <td>${arquivo.nome}</td>
                    <td>${arquivo.tamanho}</td>
                    <td>${arquivo.ultimo_acesso}</td>
                    <td>
                        <span class="badge rounded-pill ${arquivo.status === 'OK' ? 'bg-success' : 'bg-danger'}">
                            ${arquivo.status === 'OK' ? '✅ OK' : '❌ Falha'}
                        </span>
                    </td>
                </tr>
            `;
        });
    });
    
    elements.tableBody.innerHTML = tableHTML;
    elements.tableLoading.classList.add('d-none');
    elements.tableContainer.classList.remove('d-none');
}

// Atualiza timestamp
function updateTimestamp() {
    elements.lastUpdate.textContent = new Date().toLocaleString();
}

// Mostra estado de carregamento
function showLoading() {
    elements.errorAlert.classList.add('d-none');
    elements.chart.classList.add('d-none');
    elements.chartLoading.classList.remove('d-none');
    elements.tableContainer.classList.add('d-none');
    elements.tableLoading.classList.remove('d-none');
}

// Mostra erros
function showError(message) {
    elements.errorAlert.textContent = message;
    elements.errorAlert.classList.remove('d-none');
    elements.tableLoading.classList.add('d-none');
}