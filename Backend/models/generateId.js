const crypto = require('crypto');

class CaseIdGenerator {
    constructor() {
        this.prefix = 'RS';
        this.year = new Date().getFullYear();
        this.month = String(new Date().getMonth() + 1).padStart(2, '0');
    }

    /**
     * Generate a unique case ID in format: RS-YYYYMM-XXXXXX
     * Example: RS-202401-ABC123
     */
    generate() {
        const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
        const random = crypto.randomBytes(2).toString('hex').toUpperCase();
        return `${this.prefix}-${this.year}${this.month}-${timestamp}${random}`;
    }

    /**
     * Generate case ID with specific type prefix
     * @param {string} type - Incident type (harassment, threat, etc.)
     */
    generateWithType(type) {
        const typeMap = {
            'harassment': 'HR',
            'threats': 'TH',
            'image_abuse': 'IA',
            'cyberstalking': 'CS',
            'doxxing': 'DX',
            'deepfake': 'DF'
        };
        
        const typePrefix = typeMap[type] || 'GN'; // GN for general
        const random = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `${this.prefix}-${typePrefix}-${this.year}${this.month}-${random}`;
    }

    /**
     * Validate case ID format
     * @param {string} caseId - The case ID to validate
     */
    validate(caseId) {
        const pattern = /^RS-(?:[A-Z]{2}-)?\d{6}-[A-Z0-9]{6,8}$/;
        return pattern.test(caseId);
    }

    /**
     * Parse case ID to extract information
     * @param {string} caseId - The case ID to parse
     */
    parse(caseId) {
        if (!this.validate(caseId)) {
            throw new Error('Invalid case ID format');
        }

        const parts = caseId.split('-');
        const typeCodes = {
            'HR': 'Harassment',
            'TH': 'Threats',
            'IA': 'Image Abuse',
            'CS': 'Cyberstalking',
            'DX': 'Doxxing',
            'DF': 'Deepfake',
            'GN': 'General'
        };

        return {
            fullId: caseId,
            prefix: parts[0],
            typeCode: parts.length === 4 ? parts[1] : 'GN',
            typeName: typeCodes[parts.length === 4 ? parts[1] : 'GN'] || 'Unknown',
            yearMonth: parts.length === 4 ? parts[2] : parts[1],
            year: parts.length === 4 ? parts[2].slice(0, 4) : parts[1].slice(0, 4),
            month: parts.length === 4 ? parts[2].slice(4, 6) : parts[1].slice(4, 6),
            uniqueCode: parts.length === 4 ? parts[3] : parts[2],
            createdAt: new Date(
                parseInt(parts.length === 4 ? parts[2].slice(0, 4) : parts[1].slice(0, 4)),
                parseInt(parts.length === 4 ? parts[2].slice(4, 6) : parts[1].slice(4, 6)) - 1,
                1
            )
        };
    }

    /**
     * Get statistics from a list of case IDs
     * @param {Array} caseIds - Array of case IDs
     */
    getStatistics(caseIds) {
        const stats = {
            total: caseIds.length,
            byType: {},
            byMonth: {},
            byYear: {}
        };

        caseIds.forEach(caseId => {
            try {
                const parsed = this.parse(caseId);
                
                // Count by type
                stats.byType[parsed.typeName] = (stats.byType[parsed.typeName] || 0) + 1;
                
                // Count by month
                const monthKey = `${parsed.year}-${parsed.month}`;
                stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;
                
                // Count by year
                stats.byYear[parsed.year] = (stats.byYear[parsed.year] || 0) + 1;
            } catch (error) {
                // Skip invalid case IDs
                console.warn(`Invalid case ID: ${caseId}`);
            }
        });

        return stats;
    }

    /**
     * Generate a batch of unique case IDs
     * @param {number} count - Number of IDs to generate
     */
    generateBatch(count = 10) {
        const ids = new Set();
        while (ids.size < count) {
            ids.add(this.generate());
        }
        return Array.from(ids);
    }

    /**
     * Generate a human-readable case ID
     */
    generateHumanReadable() {
        const adjectives = ['Safe', 'Secure', 'Protected', 'Anonymous', 'Confidential'];
        const nouns = ['Report', 'Case', 'Incident', 'Submission', 'Record'];
        const randomNum = Math.floor(Math.random() * 900) + 100;
        
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        
        return `${adj}${noun}${randomNum}`;
    }

    /**
     * Generate both technical and human-readable IDs
     */
    generateDualId() {
        return {
            technicalId: this.generate(),
            humanReadableId: this.generateHumanReadable(),
            qrCodeData: `https://reportsafe.example.com/track/${this.generate()}`
        };
    }
}

// Export singleton instance
module.exports = new CaseIdGenerator();

// Alternative: Export class for testing
module.exports.CaseIdGenerator = CaseIdGenerator;