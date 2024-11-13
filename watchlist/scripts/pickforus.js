// create a canvas with a wheel with every series in the watchlist that is not yet started
// the wheel should be able to be spun by the user
// when the wheel stops spinning, the user should be shown the series that was selected and be able to mark it as started
// the wheel should be able to be spun again even if the user has not marked the previous series as started

class WheelOfSeries {
    constructor(series) {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.series = series;
        this.currentRotation = 0;
        this.isSpinning = false;
        this.spinButton = document.getElementById('spinButton');
        this.resultDiv = document.getElementById('result');

        //set canvas size
        this.canvas.width = 500;
        this.canvas.height = 500;

        this.init();
    }

    init() {
        this.spinButton.addEventListener('click', () => this.spin());
        this.draw();
    }

    drawArrow() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const arrowSize = 10;

        ctx.save();
        
        // Position the arrow
        ctx.beginPath();
        ctx.moveTo(centerX, 10);
        ctx.lineTo(centerX - arrowSize/2, arrowSize + 10);
        ctx.lineTo(centerX + arrowSize/2, arrowSize + 10);
        ctx.closePath();

        // style the arrow
        ctx.fillStyle = '#ff0000';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;

        ctx.fill();
        ctx.stroke();

        //Center dot for visual reference
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#000';
        ctx.fill();

        ctx.restore();
    }

    draw() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw the wheel
        const sectionAngle = (2 * Math.PI) / this.series.length;

        this.series.forEach((series, index) => {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, index * sectionAngle + this.currentRotation, (index + 1) * sectionAngle + this.currentRotation);
            ctx.closePath();

            // Alternative colors
            ctx.fillStyle = index % 2 ? '#f1f1f1' : '#f8f8f8';
            ctx.fill();

            //Add series name
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(index * sectionAngle + sectionAngle / 2 + this.currentRotation);
            ctx.fillStyle = '#000';
            ctx.textAlign = 'right';
            ctx.fillText(series.name, radius - 10, 0);
            ctx.restore();
        });

        ctx.restore();

        this.drawArrow();
    }

    spin() {
        if (this.isSpinning) return;

        this.isSpinning = true;
        const spinDuration = 3000;
        const startRotation = this.currentRotation;
        const totalRotation = 2 * Math.PI * (4 + Math.random()); // 4 to 5 full spins
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);

            // Ease out
            const easeOut = (t) => 1 - Math.pow(1 - t, 3);

            this.currentRotation = startRotation + totalRotation * easeOut(progress);
            this.draw();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isSpinning = false;
                this.showResult();
            }
        };

        animate();
    }

    showResult() {
        if (!this.series || this.series.length === 0) {
            this.resultDiv.textContent = 'No series available to select';
            return;
        }

        const sectionAngle = (2 * Math.PI) / this.series.length;
        const normalizedRotation = (-this.currentRotation + Math.PI/2) % (2 * Math.PI);
        const adjustedRotation = (normalizedRotation - Math.PI/2 + 2*Math.PI) % (2 * Math.PI);
        var selectedSeriesIndex = Math.floor(adjustedRotation / sectionAngle) % this.series.length;

        // Validate index before accessing
        if (selectedSeriesIndex-1 < 0) {
            selectedSeriesIndex = this.series.length;
        }
        
        this.resultDiv.textContent = `You should watch ${this.series[selectedSeriesIndex-1].name}`;
        
    }
}

// Fetch series from the server
fetch('/api/get_content?type=series')
.then(response => response.json())
.then(series => {
    // Filter out series that are not yet started
    series = series.filter(series => series.status === 0);
    // create new list that fits the format of the WheelOfSeries class
    series = series.map(series => ({ name: series.name, started: false }));
    new WheelOfSeries(series);
})