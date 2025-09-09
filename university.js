// university.js - University management functionality

// Use existing variables from dashboard instead of redeclaring
const universityAPI_BASE_URL = window.API_BASE_URL || 'http://localhost:5000';
const universityAuthToken = window.authToken || localStorage.getItem('authToken');

// Indian universities data
const INDIAN_UNIVERSITIES = [
    {
        id: 'IITB',
        name: 'Indian Institute of Technology Bombay',
        location: 'Mumbai, Maharashtra',
        type: 'Public Technical University',
        ranking: 1,
        tags: ['Engineering', 'Technology', 'Research'],
        courses: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Chemical Engineering'],
        website: 'https://www.iitb.ac.in/',
        established: 1958,
        acceptanceRate: '2-3%'
    },
    {
        id: 'IITD',
        name: 'Indian Institute of Technology Delhi',
        location: 'New Delhi',
        type: 'Public Technical University',
        ranking: 2,
        tags: ['Engineering', 'Technology', 'Research'],
        courses: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'],
        website: 'https://home.iitd.ac.in/',
        established: 1961,
        acceptanceRate: '2-3%'
    },
    {
        id: 'IITM',
        name: 'Indian Institute of Technology Madras',
        location: 'Chennai, Tamil Nadu',
        type: 'Public Technical University',
        ranking: 3,
        tags: ['Engineering', 'Technology', 'Research'],
        courses: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Aerospace Engineering'],
        website: 'https://www.iitm.ac.in/',
        established: 1959,
        acceptanceRate: '2-3%'
    },
    {
        id: 'IITK',
        name: 'Indian Institute of Technology Kanpur',
        location: 'Kanpur, Uttar Pradesh',
        type: 'Public Technical University',
        ranking: 4,
        tags: ['Engineering', 'Technology', 'Research'],
        courses: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Materials Science'],
        website: 'https://www.iitk.ac.in/',
        established: 1959,
        acceptanceRate: '2-3%'
    },
    {
        id: 'IITKGP',
        name: 'Indian Institute of Technology Kharagpur',
        location: 'Kharagpur, West Bengal',
        type: 'Public Technical University',
        ranking: 5,
        tags: ['Engineering', 'Technology', 'Research'],
        courses: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Mining Engineering'],
        website: 'https://www.iitkgp.ac.in/',
        established: 1951,
        acceptanceRate: '2-3%'
    },
    {
        id: 'BITS',
        name: 'Birla Institute of Technology and Science',
        location: 'Pilani, Rajasthan',
        type: 'Private Deemed University',
        ranking: 6,
        tags: ['Engineering', 'Science', 'Research'],
        courses: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Pharmacy'],
        website: 'https://www.bits-pilani.ac.in/',
        established: 1964,
        acceptanceRate: '5-7%'
    },
    {
        id: 'DU',
        name: 'University of Delhi',
        location: 'New Delhi',
        type: 'Public Central University',
        ranking: 7,
        tags: ['Arts', 'Science', 'Commerce', 'Research'],
        courses: ['Computer Science', 'Economics', 'English', 'Chemistry', 'Physics'],
        website: 'http://www.du.ac.in/',
        established: 1922,
        acceptanceRate: '5-10%'
    },
    {
        id: 'JNU',
        name: 'Jawaharlal Nehru University',
        location: 'New Delhi',
        type: 'Public Central University',
        ranking: 8,
        tags: ['Arts', 'Social Sciences', 'Languages', 'Research'],
        courses: ['International Relations', 'Economics', 'Linguistics', 'Computer Science'],
        website: 'https://www.jnu.ac.in/',
        established: 1969,
        acceptanceRate: '5-8%'
    },
    {
        id: 'BHU',
        name: 'Banaras Hindu University',
        location: 'Varanasi, Uttar Pradesh',
        type: 'Public Central University',
        ranking: 9,
        tags: ['Arts', 'Science', 'Engineering', 'Medical'],
        courses: ['Computer Science', 'Electrical Engineering', 'Sanskrit', 'Ayurveda'],
        website: 'https://www.bhu.ac.in/',
        established: 1916,
        acceptanceRate: '8-12%'
    },
    {
        id: 'IIMB',
        name: 'Indian Institute of Management Bangalore',
        location: 'Bangalore, Karnataka',
        type: 'Public Business School',
        ranking: 1,
        tags: ['Business', 'Management', 'Research'],
        courses: ['MBA', 'Business Analytics', 'Public Policy'],
        website: 'https://www.iimb.ac.in/',
        established: 1973,
        acceptanceRate: '1%'
    }
];

// University management functions
class UniversityManager {
    constructor() {
        this.userUniversities = [];
        this.favoriteUniversities = new Set();
    }

    // Initialize the university manager
    async init() {
        await this.loadUserUniversities();
        this.setupEventListeners();
    }

    // Load user's saved universities
    async loadUserUniversities() {
        try {
            const response = await fetch(`${universityAPI_BASE_URL}/user/universities`, {
                headers: {
                    'Authorization': `Bearer ${universityAuthToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.userUniversities = data.universities || [];

                // Update favorite universities set
                this.favoriteUniversities = new Set(
                    this.userUniversities
                        .filter(uni => uni.application_status === 'Interested')
                        .map(uni => uni.university_id)
                );

                return this.userUniversities;
            } else {
                throw new Error('Failed to load user universities');
            }
        } catch (error) {
            console.error('Error loading user universities:', error);
            return [];
        }
    }

    // Setup event listeners for university interactions
    setupEventListeners() {
        // Event delegation for university cards
        document.addEventListener('click', (e) => {
            // Favorite button
            if (e.target.closest('.favorite-btn')) {
                const card = e.target.closest('.university-card');
                const universityId = card.dataset.universityId;
                this.toggleFavorite(universityId, card);
            }

            // Apply button
            if (e.target.closest('.apply-btn')) {
                const card = e.target.closest('.university-card');
                const universityId = card.dataset.universityId;
                this.applyToUniversity(universityId, card);
            }

            // Details button
            if (e.target.closest('.details-btn')) {
                const card = e.target.closest('.university-card');
                const universityId = card.dataset.universityId;
                this.showUniversityDetails(universityId);
            }
        });
    }

    // Toggle favorite status for a university
    async toggleFavorite(universityId, cardElement) {
        try {
            const university = INDIAN_UNIVERSITIES.find(uni => uni.id === universityId);
            if (!university) {
                throw new Error('University not found');
            }

            const isFavorite = this.favoriteUniversities.has(universityId);

            if (isFavorite) {
                // Remove from favorites
                const userUniversity = this.userUniversities.find(
                    uni => uni.university_id === universityId && uni.application_status === 'Interested'
                );

                if (userUniversity) {
                    await this.removeUniversity(userUniversity.id);
                    this.favoriteUniversities.delete(universityId);
                    this.updateFavoriteButton(cardElement, false);
                    this.showToast('Removed from favorites', 'success');
                }
            } else {
                // Add to favorites
                await this.addUniversity(universityId, university.name, 'Interested');
                this.favoriteUniversities.add(universityId);
                this.updateFavoriteButton(cardElement, true);
                this.showToast('Added to favorites', 'success');
            }

            // Update dashboard stats
            if (typeof updateDashboardStats === 'function') {
                updateDashboardStats();
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            this.showToast('Error updating favorites', 'error');
        }
    }

    // Apply to a university
    async applyToUniversity(universityId, cardElement) {
        try {
            const university = INDIAN_UNIVERSITIES.find(uni => uni.id === universityId);
            if (!university) {
                throw new Error('University not found');
            }

            // Check if already applied
            const alreadyApplied = this.userUniversities.some(
                uni => uni.university_id === universityId && uni.application_status === 'Applied'
            );

            if (alreadyApplied) {
                this.showToast('You have already applied to this university', 'info');
                return;
            }

            // Add or update university with Applied status
            const existingUniversity = this.userUniversities.find(uni => uni.university_id === universityId);

            if (existingUniversity) {
                await this.updateUniversityStatus(existingUniversity.id, 'Applied');
            } else {
                await this.addUniversity(universityId, university.name, 'Applied');
            }

            // Update UI
            this.updateApplyButton(cardElement, true);
            this.showToast('Application submitted successfully', 'success');

            // Reload user universities
            await this.loadUserUniversities();

            // Update dashboard stats
            if (typeof updateDashboardStats === 'function') {
                updateDashboardStats();
            }
        } catch (error) {
            console.error('Error applying to university:', error);
            this.showToast('Error submitting application', 'error');
        }
    }

    // Show university details in a modal
    showUniversityDetails(universityId) {
        const university = INDIAN_UNIVERSITIES.find(uni => uni.id === universityId);
        if (!university) return;

        // Create and show modal with university details
        const modalHtml = `
            <div class="modal fade" id="universityModal" tabindex="-1" aria-labelledby="universityModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="universityModalLabel">${university.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Location:</strong> ${university.location}</p>
                                    <p><strong>Type:</strong> ${university.type}</p>
                                    <p><strong>Established:</strong> ${university.established}</p>
                                    <p><strong>Acceptance Rate:</strong> ${university.acceptanceRate}</p>
                                    <p><strong>Ranking:</strong> ${university.ranking} in India</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Popular Courses:</strong></p>
                                    <ul>
                                        ${university.courses.map(course => `<li>${course}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                            <div class="mt-3">
                                <p><strong>Tags:</strong> 
                                    ${university.tags.map(tag => `<span class="badge bg-primary me-1">${tag}</span>`).join('')}
                                </p>
                            </div>
                            <div class="mt-3">
                                <a href="${university.website}" target="_blank" class="btn btn-outline-primary btn-sm">
                                    Visit Official Website
                                </a>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('universityModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body and show it
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('universityModal'));
        modal.show();
    }

    // Add a university to user's list
    async addUniversity(universityId, universityName, status) {
        try {
            const response = await fetch(`${universityAPI_BASE_URL}/user/universities`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${universityAuthToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    university_id: universityId,
                    university_name: universityName,
                    application_status: status
                })
            });

            if (!response.ok) {
                throw new Error('Failed to add university');
            }

            // Reload user universities
            await this.loadUserUniversities();
            return true;
        } catch (error) {
            console.error('Error adding university:', error);
            throw error;
        }
    }

    // Update university status
    async updateUniversityStatus(universityDbId, status) {
        try {
            const response = await fetch(`${universityAPI_BASE_URL}/user/universities/${universityDbId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${universityAuthToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    application_status: status
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update university status');
            }

            // Reload user universities
            await this.loadUserUniversities();
            return true;
        } catch (error) {
            console.error('Error updating university status:', error);
            throw error;
        }
    }

    // Remove a university from user's list
    async removeUniversity(universityDbId) {
        try {
            const response = await fetch(`${universityAPI_BASE_URL}/user/universities/${universityDbId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${universityAuthToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to remove university');
            }

            // Reload user universities
            await this.loadUserUniversities();
            return true;
        } catch (error) {
            console.error('Error removing university:', error);
            throw error;
        }
    }

    // Update favorite button appearance
    updateFavoriteButton(cardElement, isFavorite) {
        const favoriteBtn = cardElement.querySelector('.favorite-btn');
        if (!favoriteBtn) return;

        if (isFavorite) {
            favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Favorited';
            favoriteBtn.classList.add('btn-danger');
            favoriteBtn.classList.remove('btn-outline-danger');
        } else {
            favoriteBtn.innerHTML = '<i class="far fa-heart"></i> Favorite';
            favoriteBtn.classList.remove('btn-danger');
            favoriteBtn.classList.add('btn-outline-danger');
        }
    }

    // Update apply button appearance
    updateApplyButton(cardElement, isApplied) {
        const applyBtn = cardElement.querySelector('.apply-btn');
        if (!applyBtn) return;

        if (isApplied) {
            applyBtn.innerHTML = '<i class="fas fa-check"></i> Applied';
            applyBtn.classList.add('btn-success');
            applyBtn.classList.remove('btn-primary');
            applyBtn.disabled = true;
        } else {
            applyBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Apply Now';
            applyBtn.classList.remove('btn-success');
            applyBtn.classList.add('btn-primary');
            applyBtn.disabled = false;
        }
    }

    // Render university cards
    renderUniversityCards(universities, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        universities.forEach(university => {
            const isFavorite = this.favoriteUniversities.has(university.id);
            const userUniversity = this.userUniversities.find(uni => uni.university_id === university.id);
            const isApplied = userUniversity && userUniversity.application_status === 'Applied';

            const cardHtml = `
                <div class="university-card" data-university-id="${university.id}">
                    <div class="university-img">
                        <i class="fas fa-university"></i>
                    </div>
                    <div class="university-content">
                        <h5 class="university-name">${university.name}</h5>
                        <p class="university-location">
                            <i class="fas fa-map-marker-alt"></i> ${university.location} • ${university.type}
                        </p>
                        <div class="university-tags">
                            ${university.tags.map(tag => `<span class="university-tag">${tag}</span>`).join('')}
                        </div>
                        <div class="mb-2">
                            <small class="text-muted">Rank: #${university.ranking} | Acceptance: ${university.acceptanceRate}</small>
                        </div>
                        <div class="university-actions">
                            <button class="btn btn-outline-secondary btn-sm details-btn">
                                <i class="fas fa-info-circle"></i> Details
                            </button>
                            <button class="btn ${isFavorite ? 'btn-danger' : 'btn-outline-danger'} btn-sm favorite-btn">
                                <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i> ${isFavorite ? 'Favorited' : 'Favorite'}
                            </button>
                            <button class="btn ${isApplied ? 'btn-success' : 'btn-primary'} btn-sm apply-btn" ${isApplied ? 'disabled' : ''}>
                                <i class="${isApplied ? 'fas fa-check' : 'fas fa-paper-plane'}"></i> ${isApplied ? 'Applied' : 'Apply Now'}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            container.insertAdjacentHTML('beforeend', cardHtml);
        });
    }

    // Filter universities based on search query
    filterUniversities(query) {
        if (!query) return INDIAN_UNIVERSITIES;

        const lowerQuery = query.toLowerCase();
        return INDIAN_UNIVERSITIES.filter(university =>
            university.name.toLowerCase().includes(lowerQuery) ||
            university.location.toLowerCase().includes(lowerQuery) ||
            university.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
            university.courses.some(course => course.toLowerCase().includes(lowerQuery))
        );
    }

    // Sort universities based on criteria
    sortUniversities(universities, criteria) {
        const sorted = [...universities];

        switch (criteria) {
            case 'ranking':
                return sorted.sort((a, b) => a.ranking - b.ranking);
            case 'location':
                return sorted.sort((a, b) => a.location.localeCompare(b.location));
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'recommended':
            default:
                // For recommended, we might use a more complex algorithm
                // For now, just sort by ranking
                return sorted.sort((a, b) => a.ranking - b.ranking);
        }
    }

    // Load and display universities
    async loadUniversities(sortBy = 'recommended', searchQuery = '') {
        try {
            // Show loading spinner
            document.getElementById('universitiesSpinner').style.display = 'block';
            document.getElementById('universitiesGrid').style.display = 'none';

            // Filter and sort universities
            let filteredUniversities = this.filterUniversities(searchQuery);
            let sortedUniversities = this.sortUniversities(filteredUniversities, sortBy);

            // Render university cards
            this.renderUniversityCards(sortedUniversities, 'universitiesGrid');

            // Hide spinner and show grid
            document.getElementById('universitiesSpinner').style.display = 'none';
            document.getElementById('universitiesGrid').style.display = 'grid';

        } catch (error) {
            console.error('Error loading universities:', error);
            this.showToast('Error loading universities', 'error');
        }
    }

    // Load and display recommendations
    async loadRecommendations() {
        try {
            // Show loading spinner
            document.getElementById('recommendationsSpinner').style.display = 'block';
            document.getElementById('recommendationsGrid').style.display = 'none';

            // For now, just show top 4 universities by ranking
            // In a real app, this would be based on user profile and preferences
            const recommendedUniversities = INDIAN_UNIVERSITIES
                .sort((a, b) => a.ranking - b.ranking)
                .slice(0, 4);

            // Render recommended universities
            this.renderUniversityCards(recommendedUniversities, 'recommendationsGrid');

            // Hide spinner and show grid
            document.getElementById('recommendationsSpinner').style.display = 'none';
            document.getElementById('recommendationsGrid').style.display = 'grid';

        } catch (error) {
            console.error('Error loading recommendations:', error);
            this.showToast('Error loading recommendations', 'error');
        }
    }

    // Show toast notification
    showToast(message, type = 'info') {
        // Use the existing toast implementation from dashboard if available
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            // Fallback if showToast is not defined
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Initialize university manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    window.universityManager = new UniversityManager();
    window.universityManager.init();
});