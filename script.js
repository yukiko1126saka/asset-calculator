document.addEventListener('DOMContentLoaded', function() {
    // チャート用の変数
    let assetChart = null;
    
    // 計算ボタンのクリックイベントを設定
    const calculateBtn = document.getElementById('calculateBtn');
    calculateBtn.addEventListener('click', validateAndCalculate);
    
    // バリデーションと計算の実行
    function validateAndCalculate() {
        // エラーメッセージをリセット
        const errorMessageElement = document.getElementById('errorMessage');
        errorMessageElement.textContent = '';
        
        // 入力値の取得
        const currentAssetInput = document.getElementById('currentAsset');
        const monthlyInvestmentInput = document.getElementById('monthlyInvestment');
        const interestRateInput = document.getElementById('interestRate');
        const periodInput = document.getElementById('period');
        
        // 入力値のバリデーション
        if (!currentAssetInput.value.trim()) {
            errorMessageElement.textContent = '現在の資産額が未入力です';
            return;
        }
        
        if (!monthlyInvestmentInput.value.trim()) {
            errorMessageElement.textContent = '毎月の投資金額が未入力です';
            return;
        }
        
        if (!interestRateInput.value.trim()) {
            errorMessageElement.textContent = '年間運用利回りが未入力です';
            return;
        }
        
        if (!periodInput.value.trim()) {
            errorMessageElement.textContent = '運用期間が未入力です';
            return;
        }
        
        // バリデーションが通ったら計算実行
        calculateFutureAsset();
    }
    
    // 計算ロジック
    function calculateFutureAsset() {
        // 入力値の取得（万円単位で入力されている）
        const currentAsset = parseFloat(document.getElementById('currentAsset').value) || 0;
        const monthlyInvestment = parseFloat(document.getElementById('monthlyInvestment').value) || 0;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
        const period = parseInt(document.getElementById('period').value) || 0;
        
        // 年利率（小数形式）
        const annualRate = interestRate / 100;
        
        // 初期資産の将来価値計算（複利計算: 元本 × (1 + 利回り)^運用年数）
        const initialAssetFutureValue = currentAsset * Math.pow((1 + annualRate), period);
        
        // 毎月積立の将来価値計算
        let monthlyContributionFutureValue = 0;
        if (monthlyInvestment > 0) {
            // 毎月の積立額を月利で複利計算
            const monthlyRate = annualRate / 12;
            const totalMonths = period * 12;
            
            if (monthlyRate > 0) {
                // 等比数列の和の公式: PMT * ((1 + r)^n - 1) / r
                monthlyContributionFutureValue = monthlyInvestment * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
            } else {
                // 利率が0の場合は単純に積立総額
                monthlyContributionFutureValue = monthlyInvestment * totalMonths;
            }
        }
        
        // 将来の資産額 = 初期資産の将来価値 + 毎月積立の将来価値
        const futureAsset = initialAssetFutureValue + monthlyContributionFutureValue;
        
        // 投資総額 = 初期資産 + 毎月積立額 × 運用月数
        const totalInvestment = currentAsset + (monthlyInvestment * period * 12);
        
        // 増加額と増加率の計算
        const assetIncrease = futureAsset - totalInvestment;
        const increaseRate = totalInvestment > 0 ? (assetIncrease / totalInvestment) * 100 : 0;
        
        // 結果の表示（万円単位）
        document.getElementById('futureAsset').textContent = formatCurrency(futureAsset) + '万円';
        document.getElementById('assetIncrease').textContent = formatCurrency(assetIncrease) + '万円';
        document.getElementById('increaseRate').textContent = increaseRate.toFixed(2) + '%';
        
        // グラフデータの作成と更新
        createAssetGrowthChart(currentAsset, monthlyInvestment, annualRate, period);
    }
    
    // 各年の資産推移データを計算
    function calculateYearlyAssetData(currentAsset, monthlyInvestment, annualRate, years) {
        const yearLabels = [];
        const investmentData = [];
        const totalAssetData = [];
        
        // 初期値（0年目）
        yearLabels.push(0);
        investmentData.push(currentAsset);
        totalAssetData.push(currentAsset);
        
        let cumulativeInvestment = currentAsset;
        let totalAsset = currentAsset;
        
        // 1年目から指定年数までのデータを計算
        for (let year = 1; year <= years; year++) {
            yearLabels.push(year);
            
            // その年の追加投資額（12ヶ月分）
            const yearlyInvestment = monthlyInvestment * 12;
            cumulativeInvestment += yearlyInvestment;
            
            // 資産の成長計算（前年の資産額に利回りを掛けて、当年の投資額を加算）
            totalAsset = totalAsset * (1 + annualRate) + yearlyInvestment;
            
            // 小数点以下2桁で丸める
            investmentData.push(parseFloat(cumulativeInvestment.toFixed(2)));
            totalAssetData.push(parseFloat(totalAsset.toFixed(2)));
        }
        
        return {
            labels: yearLabels,
            investmentData: investmentData,
            totalAssetData: totalAssetData
        };
    }
    
    // 資産推移グラフの作成・更新
    function createAssetGrowthChart(currentAsset, monthlyInvestment, annualRate, years) {
        const chartData = calculateYearlyAssetData(currentAsset, monthlyInvestment, annualRate, years);
        const ctx = document.getElementById('assetChart').getContext('2d');
        
        // 既存のチャートがあれば破棄
        if (assetChart) {
            assetChart.destroy();
        }
        
        // 新しいチャートを作成
        assetChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels.map(year => year + '年'),
                datasets: [
                    {
                        label: '投資総額',
                        data: chartData.investmentData,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        fill: true
                    },
                    {
                        label: '資産総額（利益含む）',
                        data: chartData.totalAssetData,
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        borderWidth: 2,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '年数別資産推移'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toLocaleString() + '万円';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '経過年数'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '資産額（万円）'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString() + '万円';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // 通貨フォーマット関数（万円単位で、小数点以下2桁まで表示）
    function formatCurrency(value) {
        return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
});