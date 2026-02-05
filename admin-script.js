// Verificação de login
if (!sessionStorage.getItem('adminLoggedIn')) {
    window.location.href = 'admin-login.html';
}

// Obter usuário logado
const adminUser = JSON.parse(sessionStorage.getItem('adminUser') || '{}');

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', function() {
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminUser');
    window.location.href = 'admin-login.html';
});

// Controle de Abas
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        this.classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        if (tabName === 'propostas-lista') {
            carregarPropostas();
        } else if (tabName === 'gerenciar-admins') {
            carregarAdmins();
        }
    });
});

// Função para calcular todos os valores
function calcularValores(dados) {
    const contaAtual = parseFloat(dados.contaAtual);
    const kwhMes = parseFloat(dados.kwhMes);
    const valorTotal = parseFloat(dados.valorTotal);
    const tarifaKwh = parseFloat(dados.tarifaKwh) || 0.85;
    
    // Economia mensal (aproximadamente 95% da conta)
    const economiaMensal = contaAtual * 0.95;
    
    // Nova conta de luz (aproximadamente 5% da conta atual - taxa mínima)
    const novaContaLuz = contaAtual * 0.05;
    
    // Economia anual
    const economiaAnual = economiaMensal * 12;
    
    // Economia em 25 anos (com reajuste médio de 8% ao ano na tarifa)
    let economia25Anos = 0;
    let economiaAnualAtual = economiaAnual;
    for (let i = 0; i < 25; i++) {
        economia25Anos += economiaAnualAtual;
        economiaAnualAtual *= 1.08; // Reajuste anual
    }
    
    // Payback em anos
    const paybackAnos = valorTotal / economiaAnual;
    const paybackMeses = Math.round(paybackAnos * 12);
    
    // ROI (Retorno sobre Investimento) em 25 anos
    const roi = ((economia25Anos - valorTotal) / valorTotal) * 100;
    
    // Geração total em 25 anos
    const geracaoTotal25Anos = kwhMes * 12 * 25;
    
    return {
        economiaMensal,
        economiaAnual,
        economia25Anos,
        paybackAnos,
        paybackMeses,
        roi,
        novaContaLuz,
        geracaoTotal25Anos,
        reducaoPercentual: 95
    };
}

// Formatação de valores
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
    }).format(valor);
}

function formatarNumero(valor) {
    return new Intl.NumberFormat('pt-BR', { 
        maximumFractionDigits: 2 
    }).format(valor);
}

// Preview dos cálculos
document.getElementById('previewBtn')?.addEventListener('click', function() {
    const form = document.getElementById('propostaForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const dados = {
        contaAtual: document.getElementById('contaAtual').value,
        kwhMes: document.getElementById('kwhMes').value,
        valorTotal: document.getElementById('valorTotal').value,
        tarifaKwh: document.getElementById('tarifaKwh').value || 0.85
    };
    
    const calculos = calcularValores(dados);
    
    document.getElementById('economiaMensal').textContent = formatarMoeda(calculos.economiaMensal);
    document.getElementById('economiaAnual').textContent = formatarMoeda(calculos.economiaAnual);
    document.getElementById('economia25Anos').textContent = formatarMoeda(calculos.economia25Anos);
    document.getElementById('payback').textContent = `${calculos.paybackMeses} meses (${calculos.paybackAnos.toFixed(1)} anos)`;
    document.getElementById('roi').textContent = `${formatarNumero(calculos.roi)}%`;
    document.getElementById('novaContaLuz').textContent = formatarMoeda(calculos.novaContaLuz);
    
    document.getElementById('calculosPreview').style.display = 'block';
});

// Submissão do formulário e geração de PDF
document.getElementById('propostaForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const dados = {
        nomeCliente: document.getElementById('nomeCliente').value,
        cidadeCliente: document.getElementById('cidadeCliente').value,
        contaAtual: document.getElementById('contaAtual').value,
        kwhMes: document.getElementById('kwhMes').value,
        valorTotal: document.getElementById('valorTotal').value,
        valorParcela: document.getElementById('valorParcela').value || '',
        numParcelas: document.getElementById('numParcelas').value || '',
        tarifaKwh: document.getElementById('tarifaKwh').value || 0.85
    };
    
    const calculos = calcularValores(dados);
    
    // Gerar PDF
    await gerarPDF(dados, calculos);
    
    // Salvar proposta
    salvarProposta(dados, calculos);
    
    // Limpar formulário
    this.reset();
    document.getElementById('calculosPreview').style.display = 'none';
    
    alert('Proposta gerada com sucesso! O PDF foi baixado.');
});

// Função para gerar PDF com design profissional
async function gerarPDF(dados, calculos) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const pageWidth = 210;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // Cores
    const azul = [0, 120, 215];
    const azulClaro = [100, 170, 230];
    const laranja = [255, 152, 0];
    const verde = [0, 166, 81];
    const cinza = [100, 100, 100];
    const cinzaClaro = [240, 240, 240];
    
    // ============== PÁGINA 1 ==============
    
    // Cabeçalho com gradiente simulado
    doc.setFillColor(...azul);
    doc.rect(0, 0, pageWidth, 50, 'F');
    doc.setFillColor(...azulClaro);
    doc.rect(0, 40, pageWidth, 10, 'F');
    
    // Logo e título
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text('NORDESTE ENERGIA', margin, 25);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text('Proposta Comercial', margin, 35);
    doc.text('GERADOR FOTOVOLTAICO - Residencial', margin, 42);
    
    // Data alinhada à direita
    doc.setFontSize(9);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 42, { align: 'right' });
    
    // Box de informações do cliente
    let y = 60;
    doc.setFillColor(...cinzaClaro);
    doc.roundedRect(margin, y, contentWidth, 25, 2, 2, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('DADOS DO CLIENTE', margin + 5, y + 8);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(`Cliente: ${dados.nomeCliente}`, margin + 5, y + 15);
    doc.text(`Cidade: ${dados.cidadeCliente}`, margin + 5, y + 20);
    
    // Hero message
    y += 35;
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...azul);
    doc.text('Sua casa gerando sua própria energia!', margin, y);
    
    // Box de destaque - Economia Mensal
    y += 15;
    doc.setFillColor(...laranja);
    doc.roundedRect(margin, y, contentWidth, 40, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('ECONOMIA MENSAL ESTIMADA', pageWidth / 2, y + 12, { align: 'center' });
    
    doc.setFontSize(26);
    doc.setFont(undefined, 'bold');
    doc.text(formatarMoeda(calculos.economiaMensal), pageWidth / 2, y + 28, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Redução de até 95% na conta de luz', pageWidth / 2, y + 36, { align: 'center' });
    
    // Resumo do sistema
    y += 50;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...azul);
    doc.text('RESUMO DO SISTEMA', margin, y);
    
    y += 8;
    const resumoData = [
        ['Geração Mensal Estimada', `${formatarNumero(parseFloat(dados.kwhMes))} kWh`],
        ['Conta Atual Média', formatarMoeda(parseFloat(dados.contaAtual))],
        ['Nova Conta Estimada (Taxa Mínima)', formatarMoeda(calculos.novaContaLuz)],
        ['Economia Mensal', formatarMoeda(calculos.economiaMensal)],
        ['Economia Anual', formatarMoeda(calculos.economiaAnual)]
    ];
    
    resumoData.forEach((item, i) => {
        const rowY = y + (i * 12);
        
        if (i % 2 === 0) {
            doc.setFillColor(...cinzaClaro);
            doc.rect(margin, rowY - 4, contentWidth, 10, 'F');
        }
        
        doc.setTextColor(...cinza);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(item[0], margin + 3, rowY + 2);
        
        doc.setTextColor(...verde);
        doc.setFont(undefined, 'bold');
        doc.text(item[1], pageWidth - margin - 3, rowY + 2, { align: 'right' });
    });
    
    // Análise Financeira
    y += 72;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...azul);
    doc.text('ANÁLISE FINANCEIRA', margin, y);
    
    y += 10;
    // Grid de 3 colunas (se houver parcela) ou 2 colunas
    
    if (dados.valorParcela && dados.numParcelas) {
        // Grid de 3 colunas
        const colWidth3 = (contentWidth - 20) / 3;
        
        // Coluna 1 - Investimento Total
        doc.setFillColor(...azulClaro);
        doc.roundedRect(margin, y, colWidth3, 35, 2, 2, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Investimento Total', margin + 5, y + 10);
        
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(formatarMoeda(parseFloat(dados.valorTotal)), margin + 5, y + 25);
        
        // Coluna 2 - Parcela Mensal
        doc.setFillColor(...laranja);
        doc.roundedRect(margin + colWidth3 + 10, y, colWidth3, 35, 2, 2, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Parcela Mensal', margin + colWidth3 + 15, y + 10);
        
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(formatarMoeda(parseFloat(dados.valorParcela)), margin + colWidth3 + 15, y + 25);
        
        // Coluna 3 - Payback
        doc.setFillColor(...verde);
        doc.roundedRect(margin + (colWidth3 * 2) + 20, y, colWidth3, 35, 2, 2, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Retorno', margin + (colWidth3 * 2) + 25, y + 10);
        
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(`${calculos.paybackMeses} meses`, margin + (colWidth3 * 2) + 25, y + 25);
    } else {
        // Grid de 2 colunas (sem parcela)
        const colWidth = (contentWidth - 10) / 2;
        
        // Coluna 1 - Investimento
        doc.setFillColor(...azulClaro);
        doc.roundedRect(margin, y, colWidth, 35, 2, 2, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Investimento Total', margin + 5, y + 10);
        
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text(formatarMoeda(parseFloat(dados.valorTotal)), margin + 5, y + 25);
        
        // Coluna 2 - Payback
        doc.setFillColor(...verde);
        doc.roundedRect(margin + colWidth + 10, y, colWidth, 35, 2, 2, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Retorno do Investimento', margin + colWidth + 15, y + 10);
        
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text(`${calculos.paybackMeses} meses`, margin + colWidth + 15, y + 25);
    }
    
    // Parcelamento (se houver)
    if (dados.valorParcela && dados.numParcelas) {
        y += 45;
        
        // Box de destaque - Pagamento Mensal Total
        doc.setFillColor(...laranja);
        doc.roundedRect(margin, y, contentWidth, 45, 3, 3, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text('VOCÊ VAI PAGAR POR MÊS:', pageWidth / 2, y + 12, { align: 'center' });
        
        const pagamentoMensal = parseFloat(dados.valorParcela) + calculos.novaContaLuz;
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text(formatarMoeda(pagamentoMensal), pageWidth / 2, y + 28, { align: 'center' });
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`(${formatarMoeda(parseFloat(dados.valorParcela))} parcela + ${formatarMoeda(calculos.novaContaLuz)} taxa mínima de luz)`, pageWidth / 2, y + 38, { align: 'center' });
        
        // Parcelamento detalhado
        y += 52;
        doc.setFillColor(...cinzaClaro);
        doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
        
        doc.setTextColor(...cinza);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text('Financiamento:', margin + 5, y + 7);
        
        doc.setTextColor(...azul);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text(`${dados.numParcelas}x de ${formatarMoeda(parseFloat(dados.valorParcela))}`, margin + 5, y + 13);
    } else {
        // Se não houver parcelamento, só mostra a taxa mínima
        y += 45;
        doc.setFillColor(...verde);
        doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text('VOCÊ VAI PAGAR POR MÊS (após instalação):', pageWidth / 2, y + 12, { align: 'center' });
        
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text(formatarMoeda(calculos.novaContaLuz), pageWidth / 2, y + 26, { align: 'center' });
    }
    
    // Rodapé página 1
    doc.setFillColor(...azul);
    doc.rect(0, 280, pageWidth, 17, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('NORDESTE ENERGIA | Soluções em Energia Solar', pageWidth / 2, 288, { align: 'center' });
    doc.text('WhatsApp: (48) 8465-8697 | @nordesteenergia__', pageWidth / 2, 293, { align: 'center' });
    
    // ============== PÁGINA 2 ==============
    doc.addPage();
    
    // Cabeçalho página 2
    doc.setFillColor(...azul);
    doc.rect(0, 0, pageWidth, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('NORDESTE ENERGIA', margin, 12);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`Proposta para ${dados.nomeCliente}`, pageWidth - margin, 12, { align: 'right' });
    
    // Projeção de Economia
    y = 35;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...azul);
    doc.text('PROJEÇÃO DE ECONOMIA EM 25 ANOS', margin, y);
    
    y += 10;
    
    // Tabela de projeção
    const tableData = [
        { periodo: 'Mensal', valor: calculos.economiaMensal },
        { periodo: '1 Ano', valor: calculos.economiaAnual },
        { periodo: '5 Anos', valor: calculos.economiaAnual * 5 * 1.08 },
        { periodo: '10 Anos', valor: calculos.economiaAnual * 10 * 1.15 },
        { periodo: '25 Anos', valor: calculos.economia25Anos }
    ];
    
    const tableStartY = y;
    const rowHeight = 12;
    
    // Cabeçalho da tabela
    doc.setFillColor(...azul);
    doc.rect(margin, tableStartY, contentWidth, rowHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('PERÍODO', margin + 5, tableStartY + 8);
    doc.text('ECONOMIA ACUMULADA', pageWidth - margin - 5, tableStartY + 8, { align: 'right' });
    
    // Linhas da tabela
    tableData.forEach((row, i) => {
        const rowY = tableStartY + rowHeight + (i * rowHeight);
        
        if (i === tableData.length - 1) {
            doc.setFillColor(...laranja);
            doc.rect(margin, rowY, contentWidth, rowHeight, 'F');
            doc.setTextColor(255, 255, 255);
        } else {
            if (i % 2 === 0) {
                doc.setFillColor(...cinzaClaro);
                doc.rect(margin, rowY, contentWidth, rowHeight, 'F');
            }
            doc.setTextColor(0, 0, 0);
        }
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(row.periodo, margin + 5, rowY + 8);
        
        doc.setFont(undefined, 'bold');
        doc.text(formatarMoeda(row.valor), pageWidth - margin - 5, rowY + 8, { align: 'right' });
    });
    
    // Indicadores de Performance
    y = tableStartY + (rowHeight * (tableData.length + 2));
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...azul);
    doc.text('INDICADORES DE PERFORMANCE', margin, y);
    
    y += 10;
    
    const kpis = [
        { label: 'ROI (Retorno sobre Investimento)', value: `${formatarNumero(calculos.roi)}%`, color: verde },
        { label: 'Redução de CO₂ (25 anos)', value: `${formatarNumero(calculos.geracaoTotal25Anos * 0.084)} kg`, color: verde },
        { label: 'Valorização do Imóvel', value: 'Até 30%', color: verde }
    ];
    
    kpis.forEach((kpi, i) => {
        const kpiY = y + (i * 22);
        
        doc.setFillColor(...cinzaClaro);
        doc.roundedRect(margin, kpiY, contentWidth, 18, 2, 2, 'F');
        
        doc.setTextColor(...cinza);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(kpi.label, margin + 5, kpiY + 7);
        
        doc.setTextColor(...kpi.color);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(kpi.value, margin + 5, kpiY + 14);
    });
    
    // Comparativo Visual
    y += 80;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...azul);
    doc.text('COMPARATIVO: ANTES E DEPOIS', margin, y);
    
    y += 12;
    
    // Barra - Antes
    doc.setFillColor(220, 53, 69);
    doc.roundedRect(margin, y, contentWidth * 0.9, 18, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Conta ANTES (mensal)', margin + 5, y + 8);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text(formatarMoeda(parseFloat(dados.contaAtual)), margin + 5, y + 14);
    
    // Barra - Depois
    y += 25;
    const barraPercent = (calculos.novaContaLuz / parseFloat(dados.contaAtual));
    const barraWidth = contentWidth * 0.9 * (barraPercent > 0.15 ? barraPercent : 0.15);
    
    doc.setFillColor(...verde);
    doc.roundedRect(margin, y, barraWidth, 18, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Conta DEPOIS (mensal)', margin + 5, y + 8);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text(formatarMoeda(calculos.novaContaLuz), margin + 5, y + 14);
    
    // Economia destacada
    y += 25;
    doc.setFillColor(...laranja);
    doc.roundedRect(margin, y, contentWidth, 15, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`ECONOMIA DE ${formatarMoeda(calculos.economiaMensal)} POR MÊS (95% de redução)`, pageWidth / 2, y + 10, { align: 'center' });
    
    // Garantias e Diferenciais
    y += 25;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...azul);
    doc.text('GARANTIAS E DIFERENCIAIS', margin, y);
    
    y += 8;
    const diferenciais = [
        '✓ Tecnologia Alemã de Alta Eficiência',
        '✓ Garantia de 25 anos nos painéis fotovoltaicos',
        '✓ Equipe técnica especializada e certificada',
        '✓ Monitoramento remoto do sistema',
        '✓ Assistência técnica completa'
    ];
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    
    diferenciais.forEach((item, i) => {
        doc.text(item, margin + 5, y + 10 + (i * 7));
    });
    
    // Rodapé página 2
    doc.setFillColor(...azul);
    doc.rect(0, 280, pageWidth, 17, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Tecnologia Alemã | Garantia de 25 anos | Financiamento Disponível', pageWidth / 2, 288, { align: 'center' });
    doc.text('WhatsApp: (48) 8465-8697 | Instagram: @nordesteenergia__', pageWidth / 2, 293, { align: 'center' });
    
    // Salvar PDF
    const nomeArquivo = `Proposta_${dados.nomeCliente.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    doc.save(nomeArquivo);
}

// Salvar proposta no localStorage
function salvarProposta(dados, calculos) {
    let propostas = JSON.parse(localStorage.getItem('propostas') || '[]');
    
    propostas.push({
        id: Date.now(),
        data: new Date().toISOString(),
        ...dados,
        ...calculos
    });
    
    localStorage.setItem('propostas', JSON.stringify(propostas));
}

// Carregar propostas salvas
function carregarPropostas() {
    const propostas = JSON.parse(localStorage.getItem('propostas') || '[]');
    const tbody = document.getElementById('propostasTableBody');
    
    if (propostas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhuma proposta criada ainda</td></tr>';
        return;
    }
    
    tbody.innerHTML = propostas.reverse().map(prop => `
        <tr>
            <td>${new Date(prop.data).toLocaleDateString('pt-BR')}</td>
            <td>${prop.nomeCliente}</td>
            <td>${prop.cidadeCliente}</td>
            <td>${formatarMoeda(parseFloat(prop.valorTotal))}</td>
            <td>${formatarMoeda(prop.economiaMensal)}</td>
            <td>${prop.paybackMeses} meses</td>
            <td>
                <button class="btn-action" onclick="baixarPropostaNovamente(${prop.id})">📥 Baixar</button>
                <button class="btn-action btn-delete" onclick="deletarProposta(${prop.id})">🗑️ Excluir</button>
            </td>
        </tr>
    `).join('');
}

// Baixar proposta novamente
window.baixarPropostaNovamente = function(id) {
    const propostas = JSON.parse(localStorage.getItem('propostas') || '[]');
    const proposta = propostas.find(p => p.id === id);
    
    if (proposta) {
        const dados = {
            nomeCliente: proposta.nomeCliente,
            cidadeCliente: proposta.cidadeCliente,
            contaAtual: proposta.contaAtual,
            kwhMes: proposta.kwhMes,
            valorTotal: proposta.valorTotal,
            valorParcela: proposta.valorParcela,
            numParcelas: proposta.numParcelas,
            tarifaKwh: proposta.tarifaKwh
        };
        
        const calculos = calcularValores(dados);
        gerarPDF(dados, calculos);
    }
};

// Deletar proposta
window.deletarProposta = function(id) {
    if (confirm('Tem certeza que deseja excluir esta proposta?')) {
        let propostas = JSON.parse(localStorage.getItem('propostas') || '[]');
        propostas = propostas.filter(p => p.id !== id);
        localStorage.setItem('propostas', JSON.stringify(propostas));
        carregarPropostas();
    }
};

// ==================== GERENCIAMENTO DE ADMINS ====================

// Cadastrar novo administrador
document.getElementById('cadastroAdminForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('novoAdminNome').value.trim();
    const username = document.getElementById('novoAdminUsername').value.trim();
    const password = document.getElementById('novoAdminPassword').value;
    const passwordConfirm = document.getElementById('novoAdminPasswordConfirm').value;
    
    // Validações
    if (password !== passwordConfirm) {
        alert('As senhas não coincidem!');
        return;
    }
    
    if (password.length < 6) {
        alert('A senha deve ter no mínimo 6 caracteres!');
        return;
    }
    
    // Verificar se o usuário já existe
    const admins = JSON.parse(localStorage.getItem('admins') || '[]');
    if (admins.find(a => a.username === username)) {
        alert('Este nome de usuário já está em uso!');
        return;
    }
    
    // Criar novo admin
    const novoAdmin = {
        id: Date.now(),
        username: username,
        password: password,
        nome: nome,
        principal: false,
        dataCriacao: new Date().toISOString()
    };
    
    admins.push(novoAdmin);
    localStorage.setItem('admins', JSON.stringify(admins));
    
    // Limpar formulário
    this.reset();
    
    alert('Administrador cadastrado com sucesso!');
    carregarAdmins();
});

// Carregar lista de administradores
function carregarAdmins() {
    const admins = JSON.parse(localStorage.getItem('admins') || '[]');
    const tbody = document.getElementById('adminsTableBody');
    
    if (admins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum administrador cadastrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = admins.map(admin => `
        <tr>
            <td>${admin.nome}</td>
            <td>${admin.username}</td>
            <td>${new Date(admin.dataCriacao).toLocaleDateString('pt-BR')}</td>
            <td>
                <span class="badge ${admin.principal ? 'badge-primary' : 'badge-secondary'}">
                    ${admin.principal ? 'Principal' : 'Secundário'}
                </span>
            </td>
            <td>
                ${!admin.principal ? `
                    <button class="btn-action" onclick="editarAdmin(${admin.id})">✏️ Editar</button>
                    <button class="btn-action btn-delete" onclick="deletarAdmin(${admin.id})">🗑️ Excluir</button>
                ` : '<span style="color: #999;">Admin Principal</span>'}
            </td>
        </tr>
    `).join('');
}

// Editar administrador
window.editarAdmin = function(id) {
    const admins = JSON.parse(localStorage.getItem('admins') || '[]');
    const admin = admins.find(a => a.id === id);
    
    if (!admin) return;
    
    const novoNome = prompt('Novo nome:', admin.nome);
    if (!novoNome || novoNome.trim() === '') return;
    
    const novoUsername = prompt('Novo usuário:', admin.username);
    if (!novoUsername || novoUsername.trim() === '') return;
    
    // Verificar se o novo username já existe (exceto para o próprio admin)
    if (admins.find(a => a.username === novoUsername && a.id !== id)) {
        alert('Este nome de usuário já está em uso!');
        return;
    }
    
    const alterarSenha = confirm('Deseja alterar a senha?');
    let novaSenha = admin.password;
    
    if (alterarSenha) {
        novaSenha = prompt('Nova senha (mínimo 6 caracteres):');
        if (!novaSenha || novaSenha.length < 6) {
            alert('Senha inválida! A senha deve ter no mínimo 6 caracteres.');
            return;
        }
    }
    
    // Atualizar admin
    const index = admins.findIndex(a => a.id === id);
    admins[index] = {
        ...admin,
        nome: novoNome.trim(),
        username: novoUsername.trim(),
        password: novaSenha
    };
    
    localStorage.setItem('admins', JSON.stringify(admins));
    alert('Administrador atualizado com sucesso!');
    carregarAdmins();
};

// Deletar administrador
window.deletarAdmin = function(id) {
    if (!confirm('Tem certeza que deseja excluir este administrador?')) return;
    
    let admins = JSON.parse(localStorage.getItem('admins') || '[]');
    const admin = admins.find(a => a.id === id);
    
    if (admin && admin.principal) {
        alert('Não é possível excluir o administrador principal!');
        return;
    }
    
    admins = admins.filter(a => a.id !== id);
    localStorage.setItem('admins', JSON.stringify(admins));
    
    alert('Administrador excluído com sucesso!');
    carregarAdmins();
};
