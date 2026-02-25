/**
 * FLAMES Logic and UI Interactions
 */

const FLAMES_MAP = {
    'F': { title: 'Friends', desc: 'A beautiful bond that stands the test of time.', color: '#3b82f6' },
    'L': { title: 'Love', desc: 'A deep, soul-stirring connection that makes the world brighter.', color: '#ec4899' },
    'A': { title: 'Affection', desc: 'A warm and gentle fondness that brings comfort to the soul.', color: '#8b5cf6' },
    'M': { title: 'Marriage', desc: 'A lifelong adventure of partnership, growth, and shared dreams.', color: '#f59e0b' },
    'E': { title: 'Enemy', desc: 'A complicated rivalry that keeps things interesting—or explosive!', color: '#ef4444' },
    'S': { title: 'Sibling', desc: 'A protective and playful relationship built on shared history.', color: '#10b981' }
};

const calculateFlames = (name1, name2) => {
    let n1 = name1.toLowerCase().replace(/\s/g, '').split('');
    let n2 = name2.toLowerCase().replace(/\s/g, '').split('');

    // Cancellation
    for (let i = 0; i < n1.length; i++) {
        for (let j = 0; j < n2.length; j++) {
            if (n1[i] === n2[j]) {
                n1.splice(i, 1);
                n2.splice(j, 1);
                i--;
                break;
            }
        }
    }

    const count = n1.length + n2.length;
    if (count === 0) return 'L'; // Default if perfectly matched

    // Elimination
    let flames = ['F', 'L', 'A', 'M', 'E', 'S'];
    let index = 0;

    while (flames.length > 1) {
        index = (index + count - 1) % flames.length;
        flames.splice(index, 1);
    }

    return flames[0];
};

document.addEventListener('DOMContentLoaded', () => {
    const calcBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const name1Input = document.getElementById('name1');
    const name2Input = document.getElementById('name2');
    const resultContainer = document.getElementById('result-container');
    const resultText = document.getElementById('result-text');
    const resultDesc = document.getElementById('result-desc');
    const calculatorCard = document.querySelector('.calculator-card');

    const handleCalculate = () => {
        const name1 = name1Input.value.trim();
        const name2 = name2Input.value.trim();

        if (!name1 || !name2) {
            alert('Please enter both names!');
            return;
        }

        const resultKey = calculateFlames(name1, name2);
        const result = FLAMES_MAP[resultKey];

        // UI Transition
        calcBtn.style.display = 'none';
        resultContainer.classList.remove('hidden');
        
        // Update Content
        resultText.textContent = result.title;
        resultText.style.color = result.color;
        resultDesc.textContent = result.desc;

        // Effects
        if (['L', 'M'].includes(resultKey)) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: [result.color, '#ffffff', '#ff0000']
            });
        }
    };

    const handleReset = () => {
        name1Input.value = '';
        name2Input.value = '';
        resultContainer.classList.add('hidden');
        calcBtn.style.display = 'block';
        name1Input.focus();
    };

    calcBtn.addEventListener('click', handleCalculate);
    resetBtn.addEventListener('click', handleReset);

    // Enter key support
    [name1Input, name2Input].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleCalculate();
        });
    });
});
