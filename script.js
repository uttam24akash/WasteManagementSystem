// Waste Management System JavaScript

class WasteManagementSystem {
    constructor() {
        this.wasteData = JSON.parse(localStorage.getItem('wasteData')) || [];
        this.currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        this.uploadedFiles = []; // Store uploaded files for current entry
        
        // Pollution factors (kg of pollution per kg of waste)
        this.pollutionFactors = {
            plastic: { air: 0.8, water: 0.3, soil: 0.2, carbon: 2.1 },
            paper: { air: 0.2, water: 0.1, soil: 0.05, carbon: 0.4 },
            glass: { air: 0.1, water: 0.05, soil: 0.02, carbon: 0.2 },
            metal: { air: 0.3, water: 0.1, soil: 0.1, carbon: 0.8 },
            organic: { air: 0.4, water: 0.2, soil: 0.1, carbon: 0.6 },
            electronic: { air: 1.2, water: 0.8, soil: 0.5, carbon: 3.2 },
            other: { air: 0.5, water: 0.2, soil: 0.15, carbon: 1.0 }
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.updateAnalysis();
        this.updateSuggestions();
        this.setDefaultDate();
    }
    
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Form submission
        document.getElementById('wasteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addWasteEntry();
        });
        
        // File upload handling
        this.setupFileUpload();
    }
    
    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab and activate button
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update content based on tab
        if (tabName === 'dashboard') {
            this.updateDashboard();
        } else if (tabName === 'analysis') {
            this.updateAnalysis();
        } else if (tabName === 'suggestions') {
            this.updateSuggestions();
        }
    }
    
    addWasteEntry() {
        const formData = {
            type: document.getElementById('wasteType').value,
            weight: parseFloat(document.getElementById('weight').value),
            disposalMethod: document.getElementById('disposalMethod').value,
            date: document.getElementById('date').value,
            timestamp: new Date().toISOString(),
            files: [...this.uploadedFiles] // Include uploaded files
        };
        
        this.wasteData.push(formData);
        this.saveData();
        this.showMessage('Waste entry added successfully!', 'success');
        this.resetForm();
        this.updateDashboard();
    }
    
    resetForm() {
        document.getElementById('wasteForm').reset();
        this.setDefaultDate();
        this.clearUploadedFiles();
    }
    
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }
    
    showMessage(text, type) {
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        const container = document.querySelector('.container');
        container.insertBefore(message, container.firstChild);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }
    
    getCurrentMonthData() {
        return this.wasteData.filter(entry => 
            entry.date.startsWith(this.currentMonth)
        );
    }
    
    calculateMonthlyMetrics() {
        const currentMonthData = this.getCurrentMonthData();
        let totalWeight = 0;
        let totalCarbon = 0;
        let recycledWeight = 0;
        
        currentMonthData.forEach(entry => {
            totalWeight += entry.weight;
            totalCarbon += entry.weight * this.pollutionFactors[entry.type].carbon;
            if (entry.disposalMethod === 'recycling') {
                recycledWeight += entry.weight;
            }
        });
        
        const recyclingRate = totalWeight > 0 ? (recycledWeight / totalWeight) * 100 : 0;
        const envScore = this.calculateEnvironmentalScore(totalWeight, recyclingRate, totalCarbon);
        
        return {
            totalWeight: totalWeight.toFixed(1),
            totalCarbon: totalCarbon.toFixed(1),
            recyclingRate: recyclingRate.toFixed(1),
            envScore: envScore
        };
    }
    
    calculateEnvironmentalScore(weight, recyclingRate, carbon) {
        // Score out of 100 based on waste amount, recycling rate, and carbon footprint
        let score = 100;
        
        // Penalize high waste generation
        if (weight > 50) score -= 20;
        else if (weight > 30) score -= 10;
        else if (weight > 20) score -= 5;
        
        // Reward high recycling rate
        if (recyclingRate < 20) score -= 30;
        else if (recyclingRate < 40) score -= 20;
        else if (recyclingRate < 60) score -= 10;
        
        // Penalize high carbon footprint
        if (carbon > 100) score -= 25;
        else if (carbon > 50) score -= 15;
        else if (carbon > 25) score -= 5;
        
        return Math.max(0, Math.min(100, score));
    }
    
    updateDashboard() {
        const metrics = this.calculateMonthlyMetrics();
        
        document.getElementById('monthlyWaste').textContent = metrics.totalWeight;
        document.getElementById('carbonFootprint').textContent = metrics.totalCarbon;
        document.getElementById('recyclingRate').textContent = metrics.recyclingRate;
        document.getElementById('envScore').textContent = metrics.envScore;
        
        this.updateWasteChart();
    }
    
    updateWasteChart() {
        const canvas = document.getElementById('wasteChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.getMonthlyTrends();
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw simple bar chart
        const barWidth = canvas.width / data.length;
        const maxWeight = Math.max(...data.map(d => d.weight), 1);
        
        data.forEach((month, index) => {
            const barHeight = (month.weight / maxWeight) * (canvas.height - 40);
            const x = index * barWidth + 10;
            const y = canvas.height - barHeight - 20;
            
            // Draw bar
            ctx.fillStyle = '#667eea';
            ctx.fillRect(x, y, barWidth - 20, barHeight);
            
            // Draw label
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(month.month, x + barWidth/2, canvas.height - 5);
        });
    }
    
    getMonthlyTrends() {
        const trends = {};
        
        this.wasteData.forEach(entry => {
            const month = entry.date.slice(0, 7);
            if (!trends[month]) {
                trends[month] = 0;
            }
            trends[month] += entry.weight;
        });
        
        return Object.entries(trends)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-6) // Last 6 months
            .map(([month, weight]) => ({
                month: month.slice(5), // MM format
                weight: weight
            }));
    }
    
    updateAnalysis() {
        this.updatePollutionImpact();
        this.updateWasteBreakdown();
        this.updateComparisonChart();
    }
    
    updatePollutionImpact() {
        const currentMonthData = this.getCurrentMonthData();
        let airPollution = 0;
        let waterPollution = 0;
        let soilContamination = 0;
        
        currentMonthData.forEach(entry => {
            const factors = this.pollutionFactors[entry.type];
            airPollution += entry.weight * factors.air;
            waterPollution += entry.weight * factors.water;
            soilContamination += entry.weight * factors.soil;
        });
        
        document.getElementById('airPollution').textContent = airPollution.toFixed(1) + ' kg';
        document.getElementById('waterPollution').textContent = waterPollution.toFixed(1) + ' kg';
        document.getElementById('soilContamination').textContent = soilContamination.toFixed(1) + ' kg';
    }
    
    updateWasteBreakdown() {
        const canvas = document.getElementById('breakdownChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const currentMonthData = this.getCurrentMonthData();
        
        // Calculate waste by type
        const wasteByType = {};
        currentMonthData.forEach(entry => {
            if (!wasteByType[entry.type]) {
                wasteByType[entry.type] = 0;
            }
            wasteByType[entry.type] += entry.weight;
        });
        
        // Draw pie chart
        const total = Object.values(wasteByType).reduce((sum, weight) => sum + weight, 0);
        if (total === 0) return;
        
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b'];
        let startAngle = 0;
        let colorIndex = 0;
        
        Object.entries(wasteByType).forEach(([type, weight]) => {
            const sliceAngle = (weight / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.arc(canvas.width/2, canvas.height/2, 80, startAngle, startAngle + sliceAngle);
            ctx.lineTo(canvas.width/2, canvas.height/2);
            ctx.fillStyle = colors[colorIndex % colors.length];
            ctx.fill();
            
            startAngle += sliceAngle;
            colorIndex++;
        });
    }
    
    updateComparisonChart() {
        const canvas = document.getElementById('comparisonChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.getMonthlyTrends();
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw line chart
        if (data.length < 2) return;
        
        const padding = 40;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;
        const maxWeight = Math.max(...data.map(d => d.weight), 1);
        
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + chartHeight - (point.weight / maxWeight) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw data points
        ctx.fillStyle = '#667eea';
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + chartHeight - (point.weight / maxWeight) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    }
    
    updateSuggestions() {
        const metrics = this.calculateMonthlyMetrics();
        const currentMonthData = this.getCurrentMonthData();
        const actionPlan = document.getElementById('actionPlan');
        
        let suggestions = [];
        
        if (parseFloat(metrics.totalWeight) > 30) {
            suggestions.push("Consider reducing waste generation by 20-30% through better planning and consumption habits.");
        }
        
        if (parseFloat(metrics.recyclingRate) < 40) {
            suggestions.push("Implement a comprehensive recycling program to increase recycling rate to 60%+.");
        }
        
        if (parseFloat(metrics.totalCarbon) > 50) {
            suggestions.push("Focus on reducing carbon footprint by choosing more sustainable disposal methods.");
        }
        
        // Analyze waste types for specific suggestions
        const wasteTypes = {};
        currentMonthData.forEach(entry => {
            wasteTypes[entry.type] = (wasteTypes[entry.type] || 0) + entry.weight;
        });
        
        if (wasteTypes.plastic > 10) {
            suggestions.push("Reduce plastic waste by using reusable containers and avoiding single-use plastics.");
        }
        
        if (wasteTypes.organic > 5) {
            suggestions.push("Start composting organic waste to reduce landfill burden and create nutrient-rich soil.");
        }
        
        if (wasteTypes.electronic > 2) {
            suggestions.push("Properly recycle electronic waste through certified e-waste recycling programs.");
        }
        
        if (suggestions.length === 0) {
            suggestions.push("Great job! Your waste management practices are environmentally friendly. Keep up the good work!");
        }
        
        actionPlan.innerHTML = suggestions.map(suggestion => 
            `<div class="suggestion-item">
                <i class="fas fa-check-circle"></i>
                <span>${suggestion}</span>
            </div>`
        ).join('');
    }
    
    saveData() {
        localStorage.setItem('wasteData', JSON.stringify(this.wasteData));
    }
    
    setupFileUpload() {
        const fileInput = document.getElementById('fileUpload');
        const uploadContainer = document.getElementById('uploadContainer');
        const fileList = document.getElementById('fileList');
        
        // Click to upload
        uploadContainer.addEventListener('click', () => {
            fileInput.click();
        });
        
        // File selection
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        // Drag and drop functionality
        uploadContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadContainer.classList.add('dragover');
        });
        
        uploadContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadContainer.classList.remove('dragover');
        });
        
        uploadContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadContainer.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
    }
    
    handleFiles(files) {
        Array.from(files).forEach(file => {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                this.showMessage(`File ${file.name} is too large. Maximum size is 10MB.`, 'error');
                return;
            }
            
            // Check file type
            const allowedTypes = ['image/', 'video/', 'application/pdf', 'text/', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            const isValidType = allowedTypes.some(type => file.type.startsWith(type));
            
            if (!isValidType) {
                this.showMessage(`File type ${file.type} is not supported.`, 'error');
                return;
            }
            
            // Add file to uploaded files
            const fileData = {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                data: null // Will store base64 data
            };
            
            // Convert file to base64 for storage
            const reader = new FileReader();
            reader.onload = (e) => {
                fileData.data = e.target.result;
                this.uploadedFiles.push(fileData);
                this.displayFileList();
            };
            reader.readAsDataURL(file);
        });
    }
    
    displayFileList() {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';
        
        this.uploadedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileIcon = this.getFileIcon(file.type);
            const fileSize = this.formatFileSize(file.size);
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="fas ${fileIcon} file-icon"></i>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${fileSize}</div>
                    </div>
                </div>
                <button class="file-remove" onclick="wasteSystem.removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // Add preview for images
            if (file.type.startsWith('image/')) {
                const preview = document.createElement('img');
                preview.src = file.data;
                preview.className = 'file-preview';
                fileItem.appendChild(preview);
            }
            
            fileList.appendChild(fileItem);
        });
    }
    
    getFileIcon(fileType) {
        if (fileType.startsWith('image/')) return 'fa-image';
        if (fileType.startsWith('video/')) return 'fa-video';
        if (fileType.includes('pdf')) return 'fa-file-pdf';
        if (fileType.includes('word') || fileType.includes('document')) return 'fa-file-word';
        if (fileType.startsWith('text/')) return 'fa-file-alt';
        return 'fa-file';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    removeFile(index) {
        this.uploadedFiles.splice(index, 1);
        this.displayFileList();
    }
    
    clearUploadedFiles() {
        this.uploadedFiles = [];
        document.getElementById('fileList').innerHTML = '';
        document.getElementById('fileUpload').value = '';
    }
}

// Initialize the application when DOM is loaded
let wasteSystem;
document.addEventListener('DOMContentLoaded', () => {
    wasteSystem = new WasteManagementSystem();
});

// Add some CSS for suggestion items
const style = document.createElement('style');
style.textContent = `
    .suggestion-item {
        display: flex;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid #e1e5e9;
    }
    
    .suggestion-item:last-child {
        border-bottom: none;
    }
    
    .suggestion-item i {
        color: #28a745;
        margin-right: 10px;
        font-size: 1.1rem;
    }
    
    .suggestion-item span {
        color: #555;
        line-height: 1.5;
    }
`;
document.head.appendChild(style);
