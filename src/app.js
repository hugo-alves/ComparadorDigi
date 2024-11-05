document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('comparison-form');
    const resultsDiv = document.getElementById('results');
    const emptyState = document.getElementById('empty-state');
    const planCards = document.querySelectorAll('.plan-card');
    const newPriceInput = document.getElementById('new-price');
    
    // Step navigation
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const nextButton = document.getElementById('next-step');
    const backButton = document.getElementById('back-step');

    // Info panel toggle
    const infoToggle = document.querySelector('.info-toggle');
    const infoContent = document.querySelector('.info-content');

    infoToggle.addEventListener('click', () => {
        infoToggle.classList.toggle('active');
        infoContent.classList.toggle('active');
    });

    // Handle step navigation
    nextButton.addEventListener('click', () => {
        // Validate step 1 fields
        const currentPrice = document.getElementById('current-price').value;
        const remainingMonths = document.getElementById('remaining-months').value;
        const exitFee = document.getElementById('exit-fee').value;

        if (!currentPrice || !remainingMonths || !exitFee) {
            alert('Por favor, preencha todos os campos do plano atual.');
            return;
        }

        step1.classList.remove('active');
        step2.classList.add('active');
    });

    backButton.addEventListener('click', () => {
        step2.classList.remove('active');
        step1.classList.add('active');
    });

    // Function to calculate months until December 31st
    function getMonthsUntilDecember() {
        const now = new Date();
        const endOfYear = new Date(now.getFullYear(), 11, 31); // December 31st
        const monthsDiff = (endOfYear.getMonth() - now.getMonth()) + 
                          (12 * (endOfYear.getFullYear() - now.getFullYear()));
        return Math.max(0, monthsDiff + 1); // +1 to include current month
    }

    // Function to calculate and display results
    function calculateAndDisplayResults(newPrice) {
        const currentPrice = parseFloat(document.getElementById('current-price').value);
        const remainingMonths = parseInt(document.getElementById('remaining-months').value);
        const exitFeeInput = parseFloat(document.getElementById('exit-fee').value);
        const exitFeeHasIVA = document.querySelector('input[name="exit-fee-iva"]:checked').value === 'with-iva';
        const promoPrice = 22; // Promotional price until December
        const monthsUntilDecember = getMonthsUntilDecember();
        
        // Calculate exit fee with IVA if needed
        const exitFee = exitFeeHasIVA ? exitFeeInput : exitFeeInput * 1.23;

        // Calculate savings considering promotional period
        const promoMonths = Math.min(monthsUntilDecember, remainingMonths);
        const regularMonths = remainingMonths - promoMonths;
        
        // Calculate savings during promotional period (current price vs 22€)
        const promoSavings = (currentPrice - promoPrice) * promoMonths;
        
        // Calculate savings after promotional period (current price vs full new price)
        const regularSavings = (currentPrice - newPrice) * regularMonths;
        
        // Calculate total potential savings
        const totalPotentialSavings = promoSavings + regularSavings;
        
        // Subtract exit fee to get actual savings
        const actualSavings = totalPotentialSavings - exitFee;

        // Calculate average monthly savings for breakeven
        const totalSavingsPerMonth = totalPotentialSavings / remainingMonths;
        const breakevenMonths = totalSavingsPerMonth > 0 ? Math.ceil(exitFee / totalSavingsPerMonth) : Infinity;

        // Display results with more detailed breakdown
        resultsDiv.innerHTML = `
            <h3>Resultados da Análise</h3>
            <p>Período Promocional:
                <br>• ${promoMonths} meses a ${promoPrice}€ (vs. ${currentPrice}€)
                <br>• Poupança: ${promoSavings.toFixed(2)}€
            </p>
            <p>Período Regular:
                <br>• ${regularMonths} meses a ${newPrice}€ (vs. ${currentPrice}€)
                <br>• Poupança: ${regularSavings.toFixed(2)}€
            </p>
            <p>Taxa de Rescisão ${exitFeeHasIVA ? '(já com IVA)' : '(com IVA incluído)'}: ${exitFee.toFixed(2)}€</p>
            <p>Poupança Total (após taxa de rescisão): ${actualSavings.toFixed(2)}€</p>
            ${totalSavingsPerMonth > 0 ? 
                `<p>Meses até recuperar a taxa de rescisão: ${breakevenMonths}</p>` : 
                ''
            }
            <div class="recommendation ${actualSavings > 0 ? 'positive' : 'negative'}">
                ${generateRecommendation(
                    totalSavingsPerMonth,
                    actualSavings,
                    breakevenMonths,
                    remainingMonths,
                    exitFee,
                    totalPotentialSavings,
                    promoMonths,
                    promoPrice,
                    newPrice
                )}
            </div>
        `;
        
        resultsDiv.classList.remove('hidden');
        emptyState.style.display = 'none';
    }

    // Plan selection handling
    planCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove selection from other cards
            planCards.forEach(c => c.classList.remove('selected'));
            
            // Select this card
            card.classList.add('selected');
            
            // Update the price input
            const price = parseFloat(card.dataset.price);
            newPriceInput.value = price;

            // Calculate and show results immediately
            if (step1.classList.contains('active')) {
                // If still on step 1, first validate and move to step 2
                nextButton.click();
            }
            calculateAndDisplayResults(price);
        });
    });

    // Handle manual price input form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const newPrice = parseFloat(newPriceInput.value);
        calculateAndDisplayResults(newPrice);
    });
});

function generateRecommendation(
    avgMonthlySavings, 
    actualSavings, 
    breakevenMonths, 
    remainingMonths, 
    exitFee, 
    totalPotentialSavings,
    promoMonths,
    promoPrice,
    regularPrice
) {
    if (avgMonthlySavings <= 0) {
        return "❌ Não recomendamos a mudança. O novo plano não oferece poupança significativa.";
    }

    if (actualSavings <= 0) {
        return `❌ Não recomendamos a mudança. A taxa de rescisão (${exitFee.toFixed(2)}€) é maior que a poupança total possível (${totalPotentialSavings.toFixed(2)}€).`;
    }

    if (breakevenMonths > remainingMonths) {
        return `⚠️ Atenção: Precisará de ${breakevenMonths} meses para recuperar a taxa de rescisão, 
                mas só tem ${remainingMonths} meses restantes no contrato atual. 
                Recomendamos esperar até o fim do contrato.`;
    }

    return `✅ Recomendamos a mudança! 
            Pagará ${promoPrice}€/mês durante ${promoMonths} meses (até 31 de dezembro),
            depois ${regularPrice}€/mês.
            Começará a poupar dinheiro após ${breakevenMonths} meses e 
            poupará ${actualSavings.toFixed(2)}€ no total.`;
} 