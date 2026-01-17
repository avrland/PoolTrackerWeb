/**
 * Donor Email Verification - Modal Interaction
 * Handles AJAX submission of email verification form
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('donorVerificationForm');
    const emailInput = document.getElementById('donorEmail');
    const verifyBtn = document.getElementById('verifyBtn');
    const verifyBtnText = document.getElementById('verifyBtnText');
    const verifySpinner = document.getElementById('verifySpinner');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const notFoundMessage = document.getElementById('notFoundMessage');
    const modal = document.getElementById('donorVerificationModal');
    
    if (!form) return; // Modal not present on this page
    
    // Get CSRF token from form or cookie
    function getCsrfToken() {
        // Try to get from form first (Django {% csrf_token %})
        const tokenInput = form.querySelector('[name=csrfmiddlewaretoken]');
        if (tokenInput) {
            return tokenInput.value;
        }
        
        // Fallback to cookie
        const name = 'csrftoken';
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    // Hide all messages
    function hideMessages() {
        successMessage.classList.add('d-none');
        errorMessage.classList.add('d-none');
        notFoundMessage.classList.add('d-none');
        emailInput.classList.remove('is-invalid');
    }
    
    // Show loading state
    function setLoading(isLoading) {
        if (isLoading) {
            verifySpinner.classList.remove('d-none');
            verifyBtnText.textContent = 'Weryfikacja...';
            verifyBtn.disabled = true;
            emailInput.disabled = true;
        } else {
            verifySpinner.classList.add('d-none');
            verifyBtnText.textContent = 'Zweryfikuj e-mail';
            verifyBtn.disabled = false;
            emailInput.disabled = false;
        }
    }
    
    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideMessages();
        
        const email = emailInput.value.trim();
        
        // Client-side validation
        if (!email || !emailInput.checkValidity()) {
            emailInput.classList.add('is-invalid');
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await fetch('/api/verify-donor-email/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ email: email })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Success - show message and reload page
                successMessage.classList.remove('d-none');
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else if (response.status === 404) {
                // Email not found - show donation link
                notFoundMessage.classList.remove('d-none');
                setLoading(false);
            } else {
                // Other error - show error message
                errorText.textContent = data.error || 'Wystąpił błąd. Spróbuj ponownie.';
                errorMessage.classList.remove('d-none');
                setLoading(false);
            }
        } catch (error) {
            console.error('Email verification error:', error);
            errorText.textContent = 'Błąd połączenia. Sprawdź połączenie internetowe i spróbuj ponownie.';
            errorMessage.classList.remove('d-none');
            setLoading(false);
        }
    });
    
    // Reset form when modal is hidden
    if (modal) {
        modal.addEventListener('hidden.bs.modal', function() {
            form.reset();
            hideMessages();
            setLoading(false);
        });
    }
    
    // Clear validation on input
    emailInput.addEventListener('input', function() {
        emailInput.classList.remove('is-invalid');
        hideMessages();
    });
});
